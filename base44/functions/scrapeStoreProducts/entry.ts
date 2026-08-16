import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FETCH_HEADERS = {
  "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function checkRobots(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { allowed: true, details: "No robots.txt found" };
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim().toLowerCase());
    let inWildcard = false;
    const disallowed = [];
    for (const line of lines) {
      if (line.startsWith("user-agent:")) inWildcard = line.includes("*");
      else if (line.startsWith("disallow:") && inWildcard) {
        const p = line.replace("disallow:", "").trim();
        if (p) disallowed.push(p);
      }
    }
    const blocked = disallowed.some((p) => p === "/" || p === "/*");
    return { allowed: !blocked, details: blocked ? "Blocked by robots.txt" : "Allowed by robots.txt" };
  } catch {
    return { allowed: true, details: "robots.txt unreachable — proceeding" };
  }
}

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const text = await res.text();
    return text.substring(0, 80000);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { url, store_name, seller_id } = body;

    if (!url) return Response.json({ error: "url required" }, { status: 400 });
    if (!store_name) return Response.json({ error: "store_name required" }, { status: 400 });

    let baseUrl;
    try {
      baseUrl = new URL(url).origin;
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1. Check robots.txt
    const robots = await checkRobots(baseUrl);
    if (!robots.allowed) {
      return Response.json({
        error: "Skrapning inte tillåten — robots.txt blockerar denna webbplats.",
        robots_allowed: false,
        robots_details: robots.details,
      }, { status: 403 });
    }

    // 2. Find or create seller
    let seller;
    if (seller_id) {
      const existing = await base44.asServiceRole.entities.Seller.filter({ id: seller_id });
      seller = existing[0];
    }
    if (!seller) {
      const byName = await base44.asServiceRole.entities.Seller.filter({ seller_name: store_name });
      seller = byName[0];
    }
    if (!seller) {
      seller = await base44.asServiceRole.entities.Seller.create({
        seller_name: store_name,
        website_url: baseUrl,
        country: "Sweden",
        verified_status: false,
        affiliate_program: false,
      });
    }

    // 3. Create scraper job
    const job = await base44.asServiceRole.entities.ScraperJob.create({
      seller_name: store_name,
      website_url: url,
      country: "Sweden",
      scrape_type: "category_page",
      language: "swedish",
      status: "running",
      robots_allowed: true,
      started_at: new Date().toISOString(),
      seller_id: seller.id,
    });

    // 4. Fetch page
    await sleep(800);
    const html = await fetchPageContent(url);
    if (!html) {
      await base44.asServiceRole.entities.ScraperJob.update(job.id, {
        status: "failed",
        error_message: "Could not fetch page content",
        completed_at: new Date().toISOString(),
      });
      return Response.json({ error: "Kunde inte hämta sidans innehåll. Kontrollera URL:en.", job_id: job.id }, { status: 502 });
    }

    // 5. AI extraction — all fields + description rewriting
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a plant product extraction AI for NordicBotanical.com (Swedish marketplace).

Analyze this HTML from: ${url}
Store: ${store_name}

Extract ALL plant products you can find on this page. For each product extract these fields:
- product_name: Clean Swedish common plant name (as shown on page)
- scientific_name: Latin botanical name if visible (null if not)
- description: IMPORTANT — do NOT copy the store's text. Rewrite a short original description (max 150 chars) in Nordic Botanical's own wording, in Swedish. Summarize the plant's key traits.
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, rose, other]
- product_url: Full product URL (combine with base if relative). Base: ${baseUrl}
- image_url: Full image URL (combine with base if relative). Base: ${baseUrl}
- price: Current price as number (SEK)
- regular_price: Original price if discounted (null otherwise)
- discount_pct: Discount percentage as number (null if none)
- currency: Always "SEK"
- availability: "in_stock", "out_of_stock", "limited", or "pre_order"
- pot_size: Pot diameter like "12cm" if mentioned (null otherwise)
- plant_size: Height/size description if mentioned (null otherwise)
- shipping_info: Delivery/shipping info if visible (null otherwise)
- light_requirement: Light need if mentioned — e.g. "Ljus", "Halvskugga", "Skugga" (null otherwise)
- water_requirement: Water need if mentioned — e.g. "Medel", "Mycket", "Lite" (null otherwise)
- hardiness_zone: Swedish hardiness zone if mentioned — e.g. "I-III", "H1-H4" (null otherwise)
- ai_confidence: 0-100 score of how confident you are this is a real plant product

Only extract actual plant products, not accessories/soil/pots unless they contain plants.

HTML (truncated):
${html.substring(0, 50000)}

Return JSON: { "products": [...] }`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                scientific_name: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                product_url: { type: "string" },
                image_url: { type: "string" },
                price: { type: "number" },
                regular_price: { type: "number" },
                discount_pct: { type: "number" },
                currency: { type: "string" },
                availability: { type: "string" },
                pot_size: { type: "string" },
                plant_size: { type: "string" },
                shipping_info: { type: "string" },
                light_requirement: { type: "string" },
                water_requirement: { type: "string" },
                hardiness_zone: { type: "string" },
                ai_confidence: { type: "number" },
              },
            },
          },
        },
      },
    });

    const products = aiResult?.products || [];

    // 6. Detect duplicates against existing products for this seller
    const existingProducts = await base44.asServiceRole.entities.Product.filter({ seller_id: seller.id });
    const existingUrls = new Set(existingProducts.map((p) => p.product_url));

    // 7. Save as ScraperResult (draft / pending approval)
    const saved = [];
    for (const p of products) {
      if (!p.product_name || !p.price) continue;

      const productUrl = p.product_url?.startsWith("http") ? p.product_url : (baseUrl + (p.product_url || ""));
      const imageUrl = p.image_url?.startsWith("http") ? p.image_url : (p.image_url ? baseUrl + p.image_url : null);
      const isDuplicate = existingUrls.has(productUrl);

      const record = await base44.asServiceRole.entities.ScraperResult.create({
        job_id: job.id,
        seller_name: store_name,
        seller_id: seller.id,
        product_name: p.product_name,
        scientific_name: p.scientific_name || null,
        description: p.description || null,
        category: p.category || "other",
        product_url: productUrl,
        image_url: imageUrl,
        price: parseFloat(p.price) || 0,
        regular_price: p.regular_price ? parseFloat(p.regular_price) : null,
        discount_pct: p.discount_pct ? parseFloat(p.discount_pct) : null,
        currency: "SEK",
        availability: ["in_stock", "out_of_stock", "limited", "pre_order"].includes(p.availability) ? p.availability : "in_stock",
        pot_size: p.pot_size || null,
        plant_size: p.plant_size || null,
        shipping_info: p.shipping_info || null,
        light_requirement: p.light_requirement || null,
        water_requirement: p.water_requirement || null,
        hardiness_zone: p.hardiness_zone || null,
        ai_confidence: Math.min(100, Math.max(0, parseInt(p.ai_confidence) || 70)),
        is_duplicate: isDuplicate,
        status: "pending",
        last_checked: new Date().toISOString(),
      });
      saved.push(record);
      await sleep(50);
    }

    // 8. Update job
    await base44.asServiceRole.entities.ScraperJob.update(job.id, {
      status: saved.length > 0 ? "needs_review" : "completed",
      pages_scanned: 1,
      products_found: saved.length,
      products_pending: saved.length,
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      job_id: job.id,
      seller: store_name,
      robots_allowed: true,
      robots_details: robots.details,
      products_found: saved.length,
      products: saved,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});