import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function checkRobots(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true;
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
    return !blocked;
  } catch {
    return true;
  }
}

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)",
        "Accept": "text/html",
        "Accept-Language": "sv,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Truncate to avoid huge payloads
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
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { job_id } = body;

    if (!job_id) {
      return Response.json({ error: "job_id required" }, { status: 400 });
    }

    // Load job
    const jobs = await base44.asServiceRole.entities.ScraperJob.filter({ id: job_id });
    if (!jobs.length) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    const job = jobs[0];

    // Update status to running
    await base44.asServiceRole.entities.ScraperJob.update(job.id, {
      status: "running",
      started_at: new Date().toISOString(),
    });

    // 1. Check robots.txt
    let baseUrl;
    try {
      baseUrl = new URL(job.website_url).origin;
    } catch {
      await base44.asServiceRole.entities.ScraperJob.update(job.id, {
        status: "failed",
        error_message: "Invalid URL",
        completed_at: new Date().toISOString(),
      });
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    const robotsAllowed = await checkRobots(baseUrl);
    await base44.asServiceRole.entities.ScraperJob.update(job.id, { robots_allowed: robotsAllowed });

    if (!robotsAllowed) {
      await base44.asServiceRole.entities.ScraperJob.update(job.id, {
        status: "failed",
        error_message: "Blocked by robots.txt",
        completed_at: new Date().toISOString(),
      });
      return Response.json({ error: "Blocked by robots.txt", job_id: job.id });
    }

    // 2. Find or create seller
    let sellers = await base44.asServiceRole.entities.Seller.filter({ seller_name: job.seller_name });
    let seller;
    if (sellers.length > 0) {
      seller = sellers[0];
    } else {
      seller = await base44.asServiceRole.entities.Seller.create({
        seller_name: job.seller_name,
        website_url: baseUrl,
        country: "Sweden",
        verified_status: false,
        affiliate_program: false,
      });
    }

    await base44.asServiceRole.entities.ScraperJob.update(job.id, { seller_id: seller.id });

    // 3. Fetch page HTML
    await sleep(1000);
    const html = await fetchPageContent(job.website_url);

    if (!html) {
      await base44.asServiceRole.entities.ScraperJob.update(job.id, {
        status: "failed",
        error_message: "Could not fetch page content",
        completed_at: new Date().toISOString(),
      });
      return Response.json({ error: "Could not fetch page", job_id: job.id });
    }

    // 4. Use AI to extract products from the page
    const langNote = job.language === "swedish"
      ? "The website is in Swedish. Translate product names to clean Swedish common names where needed."
      : "The website is in English.";

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a plant product extraction AI for NordicBotanical.com (Swedish market).

${langNote}

Analyze this HTML from: ${job.website_url}
Seller: ${job.seller_name}
Scrape type: ${job.scrape_type}

Extract ALL plant products you can find. For each product extract:
- product_name: Clean Swedish/common plant name
- scientific_name: Latin name if visible (null if not)
- description: Short product description in Swedish (max 150 chars)
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, rose, other]
- product_url: Full product URL (combine with base if relative)
- image_url: Full image URL
- price: Current price as number in SEK
- regular_price: Original price if discounted (null otherwise)
- discount_pct: Discount percentage as number (null if none)
- currency: Always "SEK"
- availability: "in_stock", "out_of_stock", or "limited"
- pot_size: Pot diameter like "12cm" if mentioned (null otherwise)
- plant_size: Height/size description if mentioned (null otherwise)
- shipping_info: Shipping cost/info if visible (null otherwise)
- ai_confidence: 0-100 score of how confident you are this is a real plant product
- is_duplicate: false (default)

Only extract actual plant products, not accessories/soil/pots unless they contain plants.
Base URL for relative links: ${baseUrl}

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
                ai_confidence: { type: "number" },
                is_duplicate: { type: "boolean" },
              },
            },
          },
        },
      },
    });

    const products = aiResult?.products || [];

    // 5. Detect duplicates against existing products
    const existingProducts = await base44.asServiceRole.entities.Product.filter({ seller_id: seller.id });
    const existingUrls = new Set(existingProducts.map((p) => p.product_url));

    // 6. Save results as ScraperResult (pending approval)
    let savedCount = 0;
    for (const p of products) {
      if (!p.product_name || !p.price) continue;

      const productUrl = p.product_url?.startsWith("http") ? p.product_url : (baseUrl + (p.product_url || ""));
      const isDuplicate = existingUrls.has(productUrl);

      await base44.asServiceRole.entities.ScraperResult.create({
        job_id: job.id,
        seller_name: job.seller_name,
        seller_id: seller.id,
        product_name: p.product_name || "",
        scientific_name: p.scientific_name || null,
        description: p.description || null,
        category: p.category || "other",
        product_url: productUrl,
        image_url: p.image_url || null,
        price: parseFloat(p.price) || 0,
        regular_price: p.regular_price ? parseFloat(p.regular_price) : null,
        discount_pct: p.discount_pct ? parseFloat(p.discount_pct) : null,
        currency: "SEK",
        availability: ["in_stock", "out_of_stock", "limited", "pre_order"].includes(p.availability)
          ? p.availability : "in_stock",
        pot_size: p.pot_size || null,
        plant_size: p.plant_size || null,
        shipping_info: p.shipping_info || null,
        ai_confidence: Math.min(100, Math.max(0, parseInt(p.ai_confidence) || 70)),
        is_duplicate: isDuplicate,
        status: "pending",
        last_checked: new Date().toISOString(),
      });
      savedCount++;
      await sleep(50);
    }

    // 7. Update job as completed
    await base44.asServiceRole.entities.ScraperJob.update(job.id, {
      status: savedCount > 0 ? "needs_review" : "completed",
      pages_scanned: 1,
      products_found: savedCount,
      products_pending: savedCount,
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      job_id: job.id,
      seller: job.seller_name,
      robots_allowed: robotsAllowed,
      products_found: savedCount,
      status: savedCount > 0 ? "needs_review" : "completed",
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});