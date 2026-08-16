import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FETCH_HEADERS = {
  "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_SIZE = 4;

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
    return { allowed: !blocked, details: blocked ? "Blocked by robots.txt" : "Allowed" };
  } catch {
    return { allowed: true, details: "robots.txt unreachable" };
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
    const { force_all = false } = body;

    // 1. Get all sellers with a website_url
    const sellers = await base44.asServiceRole.entities.Seller.list();
    const sellersWithUrl = sellers.filter((s) => s.website_url);

    // 2. Filter to sellers not scraped in last 24h (unless force_all)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const eligible = [];
    for (const seller of sellersWithUrl) {
      const targets = await base44.asServiceRole.entities.ScrapeTarget.filter({ seller_id: seller.id });
      const target = targets[0];
      if (force_all || !target || !target.last_scraped || target.last_scraped < cutoff) {
        eligible.push({ seller, target });
      }
    }

    // 3. Pick batch
    const batch = eligible.slice(0, BATCH_SIZE);
    if (batch.length === 0) {
      return Response.json({
        message: "Alla butiker har skrapats nyligen. Använd force_all=true för att tvinga.",
        total_sellers: sellersWithUrl.length,
        eligible: 0,
      });
    }

    const results = [];

    for (const { seller, target } of batch) {
      const url = seller.website_url;
      let baseUrl;
      try {
        baseUrl = new URL(url).origin;
      } catch {
        results.push({ seller: seller.seller_name, error: "Invalid URL", skipped: true });
        continue;
      }

      // Check robots
      const robots = await checkRobots(baseUrl);
      if (!robots.allowed) {
        results.push({ seller: seller.seller_name, error: "Robots.txt blockerar", skipped: true });
        continue;
      }

      // Create or update ScrapeTarget
      let scrapeTarget = target;
      if (!scrapeTarget) {
        scrapeTarget = await base44.asServiceRole.entities.ScrapeTarget.create({
          seller_id: seller.id,
          target_url: url,
          target_type: "category_page",
          frequency: "daily",
          is_active: true,
        });
      }

      // Create scraper job
      const job = await base44.asServiceRole.entities.ScraperJob.create({
        seller_name: seller.seller_name,
        website_url: url,
        country: seller.country || "Sweden",
        scrape_type: "category_page",
        language: "swedish",
        status: "running",
        robots_allowed: true,
        started_at: new Date().toISOString(),
        seller_id: seller.id,
      });

      await sleep(500);
      const html = await fetchPageContent(url);
      if (!html) {
        await base44.asServiceRole.entities.ScraperJob.update(job.id, {
          status: "failed",
          error_message: "Could not fetch page",
          completed_at: new Date().toISOString(),
        });
        results.push({ seller: seller.seller_name, error: "Kunde inte hämta sida", job_id: job.id });
        continue;
      }

      // AI extraction
      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a plant product extraction AI for NordicBotanical.com (Swedish marketplace).

Analyze this HTML from: ${url}
Store: ${seller.seller_name}

Extract ALL plant products you can find. For each product:
- product_name: Clean Swedish plant name
- scientific_name: Latin name if visible (null if not)
- description: Rewrite a short original description (max 150 chars) in Swedish — do NOT copy store text
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, rose, other]
- product_url: Full URL (base: ${baseUrl})
- image_url: Full image URL (base: ${baseUrl})
- price: Current price as number (SEK)
- regular_price: Original price if discounted (null otherwise)
- discount_pct: Discount percentage (null if none)
- currency: "SEK"
- availability: "in_stock", "out_of_stock", "limited", or "pre_order"
- pot_size: Pot diameter if mentioned (null otherwise)
- plant_size: Height/size if mentioned (null otherwise)
- ai_confidence: 0-100

Only extract actual plant products, not accessories/soil/pots.

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
                  ai_confidence: { type: "number" },
                },
              },
            },
          },
        },
      });

      const products = aiResult?.products || [];

      // Detect duplicates
      const existingProducts = await base44.asServiceRole.entities.Product.filter({ seller_id: seller.id });
      const existingUrls = new Set(existingProducts.map((p) => p.product_url));

      let savedCount = 0;
      let dupCount = 0;
      for (const p of products) {
        if (!p.product_name || !p.price) continue;

        const productUrl = p.product_url?.startsWith("http") ? p.product_url : (baseUrl + (p.product_url || ""));
        const isDup = existingUrls.has(productUrl);
        if (isDup) { dupCount++; continue; }

        const imageUrl = p.image_url?.startsWith("http") ? p.image_url : (p.image_url ? baseUrl + p.image_url : null);

        await base44.asServiceRole.entities.ScraperResult.create({
          job_id: job.id,
          seller_name: seller.seller_name,
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
          ai_confidence: Math.min(100, Math.max(0, parseInt(p.ai_confidence) || 70)),
          is_duplicate: false,
          status: "pending",
          last_checked: new Date().toISOString(),
        });
        savedCount++;
        await sleep(50);
      }

      // Update job + target
      await base44.asServiceRole.entities.ScraperJob.update(job.id, {
        status: savedCount > 0 ? "needs_review" : "completed",
        pages_scanned: 1,
        products_found: savedCount,
        products_pending: savedCount,
        completed_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.ScrapeTarget.update(scrapeTarget.id, {
        last_scraped: new Date().toISOString(),
        products_found: (scrapeTarget.products_found || 0) + savedCount,
      });

      results.push({
        seller: seller.seller_name,
        products_found: savedCount,
        duplicates_skipped: dupCount,
        job_id: job.id,
      });
    }

    const totalProducts = results.reduce((s, r) => s + (r.products_found || 0), 0);
    return Response.json({
      message: `Skrapade ${batch.length} av ${eligible.length} berättigade butiker`,
      total_sellers: sellersWithUrl.length,
      eligible: eligible.length,
      batch_size: BATCH_SIZE,
      products_found: totalProducts,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});