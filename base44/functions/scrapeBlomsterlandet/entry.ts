import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Blomsterlandet.se FULL SITE Scraper
 * Covers ALL product categories with retry + backoff logic.
 */

const BASE_URL = "https://www.blomsterlandet.se";
const SELLER_NAME = "Blomsterlandet";
const DEFAULT_SHIPPING = 49;

const ALL_CATEGORIES = [
  // INDOOR
  { url: "/produkter/vaxter/inomhus/grona-vaxter/", label: "Gröna inomhusväxter", category: "tropical" },
  { url: "/produkter/vaxter/inomhus/blommande-vaxter/", label: "Blommande inomhusväxter", category: "other" },
  { url: "/produkter/vaxter/inomhus/orkideer/", label: "Orkidéer", category: "orchid" },
  { url: "/produkter/vaxter/inomhus/kaktus-suckulenter/", label: "Kaktus & suckulenter", category: "cactus" },
  { url: "/produkter/vaxter/inomhus/ormbunkar/", label: "Ormbunkar", category: "fern" },
  { url: "/produkter/vaxter/inomhus/palmar/", label: "Palmar inomhus", category: "palm" },
  { url: "/produkter/vaxter/inomhus/kryddvaxter/", label: "Kryddväxter inomhus", category: "herb" },
  // OUTDOOR
  { url: "/produkter/vaxter/utomhus/perenner/", label: "Perenner", category: "other" },
  { url: "/produkter/vaxter/utomhus/sommarplantor/", label: "Sommarplantor", category: "other" },
  { url: "/produkter/vaxter/utomhus/rosor/", label: "Rosor", category: "climbing" },
  { url: "/produkter/vaxter/utomhus/prydnadsbuskar/", label: "Prydnadsbuskar", category: "tree" },
  { url: "/produkter/vaxter/utomhus/barbuskar/", label: "Bärbuskar", category: "tree" },
  { url: "/produkter/vaxter/utomhus/klangvaxter/", label: "Klängväxter", category: "climbing" },
  { url: "/produkter/vaxter/utomhus/hackvaxter/", label: "Häckväxter", category: "tree" },
  { url: "/produkter/vaxter/utomhus/prydnadstrad/", label: "Prydnadsträd", category: "tree" },
  { url: "/produkter/vaxter/utomhus/frukttrad/", label: "Fruktträd", category: "tree" },
  { url: "/produkter/vaxter/utomhus/medelhavsvaxter/", label: "Medelhavsväxter", category: "tropical" },
  { url: "/produkter/vaxter/utomhus/blomsterlok/", label: "Blomsterlök", category: "other" },
  { url: "/produkter/vaxter/utomhus/gransaker-baljvaxter/", label: "Grönsaker & baljväxter", category: "herb" },
  { url: "/produkter/vaxter/utomhus/jordgubbar/", label: "Jordgubbar", category: "herb" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(base44, cat, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fullUrl = BASE_URL + cat.url;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Visit this exact blomsterlandet.se URL and list ALL plant products on the page:
URL: ${fullUrl}
Category: "${cat.label}"

Extract for each product:
- name: Swedish product name
- scientific_name: Latin name if shown (or null)
- price: current price in SEK as a number
- regular_price: original price if on sale (number or null)
- product_url: full URL starting with https://www.blomsterlandet.se
- image_url: full image URL (or null)
- availability: "in_stock", "out_of_stock", or "limited"

Return JSON { "products": [...] }. Aim for 15-30 real products with real prices.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  scientific_name: { type: "string" },
                  price: { type: "number" },
                  regular_price: { type: "number" },
                  product_url: { type: "string" },
                  image_url: { type: "string" },
                  availability: { type: "string" },
                },
              },
            },
          },
        },
      });
      return result?.products || [];
    } catch (err) {
      const isRateLimit = err.message?.includes("Rate limit") || err.message?.includes("429");
      if (isRateLimit && attempt < maxRetries) {
        const backoff = attempt * 8000; // 8s, 16s, 24s
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
  return [];
}

async function matchOrCreatePlant(base44, name, scientificName, category, plantCache) {
  if (scientificName) {
    const exact = plantCache.find(
      (p) => p.scientific_name?.toLowerCase() === scientificName.toLowerCase()
    );
    if (exact) return exact;
  }
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const fuzzy = plantCache.find((p) => {
    const pn = (p.plant_name || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    return pn === normalized || pn.includes(normalized) || normalized.includes(pn);
  });
  if (fuzzy) return fuzzy;

  const newPlant = await base44.asServiceRole.entities.Plant.create({
    plant_name: name,
    scientific_name: scientificName || null,
    category: category || "other",
  });
  plantCache.push(newPlant);
  return newPlant;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const filterCategories = body.categories || null;
    // cat_index: scrape exactly ONE category by index (0-based). Recommended for avoiding timeouts.
    const catIndex = typeof body.cat_index === "number" ? body.cat_index : null;
    const batchSize = body.batch_size || 3;
    const batchIndex = typeof body.batch === "number" ? body.batch : null;

    // 1. Find or create seller
    let sellers = await base44.asServiceRole.entities.Seller.filter({ seller_name: SELLER_NAME });
    let seller;
    if (sellers.length > 0) {
      seller = sellers[0];
    } else {
      seller = await base44.asServiceRole.entities.Seller.create({
        seller_name: SELLER_NAME,
        website_url: BASE_URL,
        country: "Sweden",
        verified_status: true,
        affiliate_program: false,
      });
    }

    let targets = filterCategories
      ? ALL_CATEGORIES.filter((c) => filterCategories.includes(c.category))
      : ALL_CATEGORIES;

    if (catIndex !== null) {
      // Single-category mode — safest, use this to avoid timeouts
      targets = [ALL_CATEGORIES[catIndex]].filter(Boolean);
    } else if (batchIndex !== null) {
      const start = batchIndex * batchSize;
      targets = targets.slice(start, start + batchSize);
    }

    const log = await base44.asServiceRole.entities.ScraperLog.create({
      run_type: "manual",
      status: "running",
      started_at: new Date().toISOString(),
    });

    const results = { created: 0, updated: 0, failed: 0, skipped: 0, errors: [] };

    // Pre-load plant cache once
    const plantCache = await base44.asServiceRole.entities.Plant.list();

    for (const cat of targets) {
      let products = [];
      try {
        products = await fetchWithRetry(base44, cat);
      } catch (err) {
        results.errors.push({ category: cat.label, error: err.message });
        results.failed++;
        await sleep(5000);
        continue;
      }

      for (const p of products) {
        if (!p.name || !p.price || !p.product_url) {
          results.skipped++;
          continue;
        }

        const productUrl = p.product_url.startsWith("http")
          ? p.product_url
          : BASE_URL + p.product_url;

        if (!productUrl.includes("blomsterlandet.se")) {
          results.skipped++;
          continue;
        }

        const now = new Date().toISOString();
        const price = parseFloat(p.price);
        const regularPrice = p.regular_price ? parseFloat(p.regular_price) : null;
        const totalPrice = price + DEFAULT_SHIPPING;
        const availability = ["in_stock", "out_of_stock", "limited"].includes(p.availability)
          ? p.availability : "in_stock";

        const existing = await base44.asServiceRole.entities.Product.filter({
          product_url: productUrl,
          seller_id: seller.id,
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.Product.update(existing[0].id, {
            price,
            regular_price: regularPrice || undefined,
            total_price: totalPrice,
            availability,
            last_checked: now,
          });
          await base44.asServiceRole.entities.PriceHistory.create({
            product_id: existing[0].id,
            price,
            shipping_cost: DEFAULT_SHIPPING,
            total_price: totalPrice,
            currency: "SEK",
            availability,
            date_checked: now,
          });
          results.updated++;
        } else {
          const plant = await matchOrCreatePlant(base44, p.name, p.scientific_name, cat.category, plantCache);
          const newProd = await base44.asServiceRole.entities.Product.create({
            product_title: p.name,
            plant_id: plant.id,
            seller_id: seller.id,
            price,
            regular_price: regularPrice || undefined,
            currency: "SEK",
            shipping_cost: DEFAULT_SHIPPING,
            total_price: totalPrice,
            product_url: productUrl,
            image_url: p.image_url || undefined,
            availability,
            last_checked: now,
          });
          await base44.asServiceRole.entities.PriceHistory.create({
            product_id: newProd.id,
            price,
            shipping_cost: DEFAULT_SHIPPING,
            total_price: totalPrice,
            currency: "SEK",
            availability,
            date_checked: now,
          });
          results.created++;
        }

        await sleep(100);
      }

      await sleep(3000); // respectful delay between categories
    }

    await base44.asServiceRole.entities.ScraperLog.update(log.id, {
      status: "completed",
      products_checked: results.created + results.updated,
      products_updated: results.updated,
      products_failed: results.failed,
      completed_at: new Date().toISOString(),
      details: JSON.stringify({ ...results, categories_scraped: targets.length }),
    });

    return Response.json({
      seller_name: SELLER_NAME,
      categories_scraped: targets.length,
      total_categories: ALL_CATEGORIES.length,
      created: results.created,
      updated: results.updated,
      failed: results.failed,
      skipped: results.skipped,
      errors: results.errors,
      log_id: log.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});