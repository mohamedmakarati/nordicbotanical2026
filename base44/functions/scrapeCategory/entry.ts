import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * scrapeCategory — discovers new products from a store category/listing page
 * using AI to extract structured product data.
 * 
 * POST body: { url: string, seller_id: string }
 */

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { url, seller_id } = body;

    if (!url || !seller_id) {
      return Response.json({ error: "url and seller_id are required" }, { status: 400 });
    }

    const origin = new URL(url).origin;
    const pathname = new URL(url).pathname;

    const allowed = await isAllowedByRobots(origin, pathname);
    if (!allowed) {
      return Response.json({ error: "Disallowed by robots.txt", url }, { status: 403 });
    }

    // Fetch the category page HTML
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return Response.json({ error: `HTTP ${res.status}`, url }, { status: 502 });
    }

    const html = await res.text();

    // Try to extract JSON-LD product listings first
    const jsonLdBlocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let structuredProducts = [];

    for (const block of jsonLdBlocks) {
      try {
        const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        const data = JSON.parse(inner);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "ItemList" && item.itemListElement) {
            structuredProducts = item.itemListElement
              .map((el) => el.item || el)
              .filter((el) => el["@type"] === "Product");
          } else if (item["@type"] === "Product") {
            structuredProducts.push(item);
          }
        }
      } catch { /* skip */ }
    }

    // Use AI to extract products from page HTML (truncate HTML to avoid token limits)
    const truncatedHtml = html.slice(0, 50000);
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a web scraper. Extract ALL plant products from this Swedish e-commerce category page HTML.
For each product find: name, price (number), currency, product URL (full absolute URL using base "${origin}"), image URL.
Return up to 50 products. Only include actual plant products (flowers, trees, bushes, houseplants, garden plants).
Ignore accessories, tools, soil, pots.

HTML:
${truncatedHtml}

Return JSON with this exact schema.`,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
                product_url: { type: "string" },
                image_url: { type: "string" },
                availability: { type: "string" }
              }
            }
          }
        }
      }
    });

    const aiProducts = aiResult?.products || [];

    // Merge structured + AI products (deduplicate by URL)
    const urlsSeen = new Set();
    const allProducts = [];

    for (const p of [...structuredProducts, ...aiProducts]) {
      const productUrl = p.product_url || p.url || null;
      if (!productUrl || urlsSeen.has(productUrl)) continue;
      urlsSeen.add(productUrl);
      allProducts.push({
        product_title: p.name || p.product_title,
        price: typeof p.price === "number" ? p.price : (parseFloat(String(p.price || "").replace(/[^0-9.,]/g, "").replace(",", ".")) || null),
        currency: p.currency || "SEK",
        product_url: productUrl,
        image_url: p.image_url || (Array.isArray(p.image) ? p.image[0] : p.image) || null,
        availability: p.availability || "in_stock",
        seller_id,
        last_checked: new Date().toISOString(),
      });
    }

    if (!allProducts.length) {
      return Response.json({ message: "No products found on page", url, products_created: 0 });
    }

    // Load existing products for this seller to avoid duplicates
    const existingProducts = await base44.asServiceRole.entities.Product.filter({ seller_id });
    const existingUrls = new Set(existingProducts.map((p) => p.product_url?.split("?")[0]));

    let created = 0;
    let skipped = 0;

    for (const product of allProducts) {
      if (!product.product_title || !product.price) { skipped++; continue; }

      const cleanUrl = product.product_url?.split("?")[0];
      if (existingUrls.has(cleanUrl)) { skipped++; continue; }

      await base44.asServiceRole.entities.Product.create(product);
      existingUrls.add(cleanUrl);
      created++;
      await sleep(200);
    }

    // Save as ScrapeTarget for future scheduled runs
    const existingTargets = await base44.asServiceRole.entities.ScrapeTarget.filter({ seller_id, target_url: url });
    if (!existingTargets.length) {
      await base44.asServiceRole.entities.ScrapeTarget.create({
        seller_id,
        target_url: url,
        target_type: "category_page",
        frequency: "daily",
        is_active: true,
        last_scraped: new Date().toISOString(),
        products_found: created,
      });
    }

    return Response.json({
      message: `Scraped ${allProducts.length} products, created ${created} new, skipped ${skipped}`,
      url,
      total_found: allProducts.length,
      products_created: created,
      products_skipped: skipped,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});