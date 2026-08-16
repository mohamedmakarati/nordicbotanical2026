import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * NordicBotanical AI Scraper
 * - Scrapes product pages respecting robots.txt
 * - AI-powered plant matching: groups same plant sold by different stores
 * - Duplicate detection across sellers
 * - Logs all activity to ScraperLog entity
 * - Records price history snapshots
 */

const RATE_LIMIT_MS = 2000;
const CACHE_HOURS = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isAllowedByRobots(baseUrl, path = "/") {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true;
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim().toLowerCase());
    let inOurAgent = false;
    let inWildcard = false;
    const disallowedWildcard = [];
    const disallowedOurs = [];
    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        inOurAgent = line.includes("nordicbotanicalbot");
        inWildcard = line.includes("*");
      } else if (line.startsWith("disallow:")) {
        const p = line.replace("disallow:", "").trim();
        if (inOurAgent) disallowedOurs.push(p);
        if (inWildcard) disallowedWildcard.push(p);
      }
    }
    const relevant = disallowedOurs.length ? disallowedOurs : disallowedWildcard;
    return !relevant.some((p) => p && path.startsWith(p));
  } catch {
    return true;
  }
}

async function scrapeProductPage(url) {
  const origin = new URL(url).origin;
  const pathname = new URL(url).pathname;
  const allowed = await isAllowedByRobots(origin, pathname);
  if (!allowed) return { error: "robots_disallowed", url };

  await sleep(RATE_LIMIT_MS);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
      "Accept": "text/html",
      "Accept-Language": "en,sv,no,da,fi",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) return { error: `http_${res.status}`, url };

  const html = await res.text();

  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogDesc  = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || null;

  let price = null, regularPrice = null, currency = null, availability = null;
  let name = ogTitle, image = ogImage;

  const jsonLdBlocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    try {
      const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const data = JSON.parse(inner);
      const product = Array.isArray(data)
        ? data.find((d) => d["@type"] === "Product")
        : data["@type"] === "Product" ? data : null;

      if (product) {
        name = product.name || name;
        image = (Array.isArray(product.image) ? product.image[0] : product.image) || image;
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer) {
          price = parseFloat(offer.price) || null;
          currency = offer.priceCurrency || null;
          if (offer.highPrice) regularPrice = parseFloat(offer.highPrice);
          const avail = (offer.availability || "").toLowerCase();
          if (avail.includes("instock")) availability = "in_stock";
          else if (avail.includes("outofstock")) availability = "out_of_stock";
          else if (avail.includes("limited")) availability = "limited";
          else if (avail.includes("preorder")) availability = "pre_order";
        }
        break;
      }
    } catch { /* skip malformed */ }
  }

  return {
    url, name, price, regularPrice, currency,
    availability: availability || "in_stock",
    image, description: ogDesc,
    last_checked: new Date().toISOString(),
  };
}

// AI: identify scientific name and normalize plant identity
async function identifyPlant(base44, productTitle, description) {
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a botanist. Given this plant product listing, extract the scientific name and canonical common name.

Product title: "${productTitle}"
Description: "${description || ""}"

Rules:
- If you find a Latin scientific name (genus species), return it
- Return the most likely canonical common name in English
- Determine the plant category from: tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, other
- Return ONLY valid JSON, no markdown

JSON schema: { "scientific_name": string|null, "common_name": string, "category": string }`,
      response_json_schema: {
        type: "object",
        properties: {
          scientific_name: { type: "string" },
          common_name: { type: "string" },
          category: { type: "string" },
        },
      },
    });
    return result;
  } catch {
    return { scientific_name: null, common_name: productTitle, category: "other" };
  }
}

// Find or create a Plant record, matching by scientific name or fuzzy common name
async function matchOrCreatePlant(base44, scientificName, commonName, category) {
  const allPlants = await base44.asServiceRole.entities.Plant.list();

  // Exact scientific name match
  if (scientificName) {
    const exact = allPlants.find(
      (p) => p.scientific_name?.toLowerCase() === scientificName.toLowerCase()
    );
    if (exact) return { plant: exact, isNew: false };
  }

  // Fuzzy common name match (simple contains)
  const normalized = commonName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const fuzzy = allPlants.find((p) => {
    const pn = p.plant_name?.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    return pn === normalized || pn?.includes(normalized) || normalized?.includes(pn || "");
  });
  if (fuzzy) return { plant: fuzzy, isNew: false };

  // AI couldn't match — create new plant record
  const newPlant = await base44.asServiceRole.entities.Plant.create({
    plant_name: commonName,
    scientific_name: scientificName || null,
    category: category || "other",
  });
  return { plant: newPlant, isNew: true };
}

// Duplicate detection: same plant_id + seller_id + similar price = duplicate URL
async function isDuplicate(base44, plantId, sellerId, productUrl) {
  const existing = await base44.asServiceRole.entities.Product.filter({
    plant_id: plantId,
    seller_id: sellerId,
  });
  return existing.some((p) => p.product_url === productUrl || (p.product_url && productUrl && p.product_url.split("?")[0] === productUrl.split("?")[0]));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const runType = body.run_type || "manual";
    const productIds = body.product_ids || null;
    const runAiMatching = body.ai_matching !== false; // default true

    // Create log entry
    const log = await base44.asServiceRole.entities.ScraperLog.create({
      run_type: runType,
      status: "running",
      started_at: new Date().toISOString(),
    });

    const results = {
      updated: [], failed: [], robots_skipped: [],
      duplicates: 0, plants_new: 0, plants_matched: 0,
    };

    // Load products to process
    let products;
    if (productIds && productIds.length) {
      products = await base44.asServiceRole.entities.Product.list();
      products = products.filter((p) => productIds.includes(p.id));
    } else {
      products = await base44.asServiceRole.entities.Product.list("-last_checked", 100);
    }

    const cutoff = new Date(Date.now() - CACHE_HOURS * 3600000).toISOString();
    const stale = products.filter((p) => !p.last_checked || p.last_checked < cutoff);

    if (!stale.length) {
      await base44.asServiceRole.entities.ScraperLog.update(log.id, {
        status: "completed",
        products_checked: 0,
        completed_at: new Date().toISOString(),
        details: JSON.stringify({ message: "All products up to date" }),
      });
      return Response.json({ message: "All products are up to date.", checked: 0, log_id: log.id });
    }

    for (const product of stale) {
      if (!product.product_url) continue;

      const scraped = await scrapeProductPage(product.product_url);

      if (scraped.error === "robots_disallowed") {
        results.robots_skipped.push(product.id);
        continue;
      }
      if (scraped.error) {
        results.failed.push({ id: product.id, error: scraped.error });
        continue;
      }

      // Update product fields
      const updates = { last_checked: scraped.last_checked };
      if (scraped.price !== null) {
        updates.price = scraped.price;
        updates.total_price = scraped.price + (product.shipping_cost || 0);
      }
      if (scraped.regularPrice) updates.regular_price = scraped.regularPrice;
      if (scraped.currency) updates.currency = scraped.currency;
      if (scraped.availability) updates.availability = scraped.availability;
      if (scraped.image) updates.image_url = scraped.image;
      if (scraped.name) updates.product_title = scraped.name;

      // AI plant matching
      if (runAiMatching && scraped.name) {
        const identity = await identifyPlant(base44, scraped.name, scraped.description);
        const { plant, isNew } = await matchOrCreatePlant(
          base44,
          identity.scientific_name,
          identity.common_name || scraped.name,
          identity.category
        );
        updates.plant_id = plant.id;
        if (isNew) results.plants_new++;
        else results.plants_matched++;

        // Duplicate check
        const dup = await isDuplicate(base44, plant.id, product.seller_id, product.product_url);
        if (dup) { results.duplicates++; continue; }
      }

      await base44.asServiceRole.entities.Product.update(product.id, updates);

      // Price history
      if (scraped.price !== null) {
        await base44.asServiceRole.entities.PriceHistory.create({
          product_id: product.id,
          price: scraped.price,
          shipping_cost: product.shipping_cost || 0,
          total_price: scraped.price + (product.shipping_cost || 0),
          currency: scraped.currency || product.currency,
          availability: scraped.availability || product.availability,
          date_checked: scraped.last_checked,
        });
      }

      results.updated.push(product.id);
      await sleep(RATE_LIMIT_MS);
    }

    await base44.asServiceRole.entities.ScraperLog.update(log.id, {
      status: "completed",
      products_checked: stale.length,
      products_updated: results.updated.length,
      products_failed: results.failed.length,
      robots_skipped: results.robots_skipped.length,
      duplicates_detected: results.duplicates,
      plants_matched: results.plants_matched,
      completed_at: new Date().toISOString(),
      details: JSON.stringify(results),
    });

    return Response.json({
      log_id: log.id,
      run_type: runType,
      total_stale: stale.length,
      updated: results.updated.length,
      failed: results.failed.length,
      robots_skipped: results.robots_skipped.length,
      duplicates_detected: results.duplicates,
      new_plants: results.plants_new,
      matched_plants: results.plants_matched,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});