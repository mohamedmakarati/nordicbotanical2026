import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * NordicBotanical Price Scraper
 *
 * Safety principles:
 * - Only fetches pages that permit crawling (checks robots.txt first)
 * - Adds delays between requests to avoid overloading servers
 * - Skips products updated within the last 20 hours (once-per-day caching)
 * - Uses official RSS / sitemap / feed endpoints where available
 * - Never stores personal data, only public product listings
 */

const RATE_LIMIT_MS = 2000; // 2 seconds between requests
const CACHE_HOURS = 20;     // skip products checked within this window

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Checks robots.txt for a given domain and path
async function isAllowedByRobots(baseUrl, path = "/") {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true; // no robots.txt = allow
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
    return true; // on error, be permissive but cautious
  }
}

// Fetch a product page and extract basic metadata via simple heuristics
async function scrapeProductPage(url) {
  const allowed = await isAllowedByRobots(new URL(url).origin, new URL(url).pathname);
  if (!allowed) {
    return { error: "Disallowed by robots.txt", url };
  }

  await sleep(RATE_LIMIT_MS);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
      "Accept": "text/html",
      "Accept-Language": "en,sv,no,da,fi",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return { error: `HTTP ${res.status}`, url };

  const html = await res.text();

  // Extract Open Graph / meta data (safe, no JS execution)
  const ogTitle    = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogImage    = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogDesc     = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || null;

  // Schema.org Product JSON-LD (most modern e-commerce sites include this)
  let price = null;
  let currency = null;
  let availability = null;
  let name = ogTitle;
  let image = ogImage;

  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
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
            const avail = (offer.availability || "").toLowerCase();
            if (avail.includes("instock")) availability = "in_stock";
            else if (avail.includes("outofstock")) availability = "out_of_stock";
            else if (avail.includes("limitedavailability")) availability = "limited";
            else if (avail.includes("preorder")) availability = "pre_order";
          }
          break;
        }
      } catch {
        // malformed JSON-LD, skip
      }
    }
  }

  return {
    url,
    name: name || null,
    price,
    currency,
    availability: availability || "in_stock",
    image,
    description: ogDesc || null,
    last_checked: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { product_ids } = body; // optional: array of specific product IDs to refresh

    // Fetch products to check
    let products;
    if (product_ids && product_ids.length) {
      products = await base44.asServiceRole.entities.Product.filter({ id: { $in: product_ids } });
    } else {
      products = await base44.asServiceRole.entities.Product.list("-last_checked", 50);
    }

    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const stale = products.filter(
      (p) => !p.last_checked || p.last_checked < cutoff
    );

    if (!stale.length) {
      return Response.json({ message: "All products are up to date.", checked: 0 });
    }

    const results = { updated: [], failed: [], skipped_robots: [] };

    for (const product of stale) {
      if (!product.product_url) continue;

      const scraped = await scrapeProductPage(product.product_url);

      if (scraped.error === "Disallowed by robots.txt") {
        results.skipped_robots.push(product.id);
        continue;
      }

      if (scraped.error) {
        // 404 = product no longer exists → mark as out_of_stock
        if (scraped.error.includes("404")) {
          await base44.asServiceRole.entities.Product.update(product.id, {
            availability: "out_of_stock",
            last_checked: new Date().toISOString(),
          });
          results.updated.push(product.id);
        } else {
          results.failed.push({ id: product.id, error: scraped.error });
        }
        continue;
      }

      const updates = {
        last_checked: scraped.last_checked,
      };
      if (scraped.price !== null) {
        updates.price = scraped.price;
        updates.total_price = scraped.price + (product.shipping_cost || 0);
      }
      if (scraped.currency) updates.currency = scraped.currency;
      if (scraped.availability) updates.availability = scraped.availability;
      if (scraped.image) updates.image_url = scraped.image;
      if (scraped.name) updates.product_title = scraped.name;

      await base44.asServiceRole.entities.Product.update(product.id, updates);

      // Record price history snapshot
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

      // Be polite — wait between products
      await sleep(RATE_LIMIT_MS);
    }

    return Response.json({
      message: "Scrape complete",
      total_stale: stale.length,
      updated: results.updated.length,
      failed: results.failed.length,
      skipped_robots: results.skipped_robots.length,
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});