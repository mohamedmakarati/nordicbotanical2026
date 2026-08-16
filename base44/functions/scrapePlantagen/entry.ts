import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Plantagen.se Full Site Scraper
 * Scrapes all plant categories, extracts product name, scientific name,
 * price, image, URL, pot/height size, availability, and discount info.
 *
 * Prices on Plantagen are shown in öre (1/100 SEK), e.g. 16990 = 169.90 SEK
 */

const BASE_URL = "https://plantagen.se";
const SELLER_NAME = "Plantagen";
const DEFAULT_SHIPPING = 0; // Plantagen is primarily in-store; many products have free shipping online

const ALL_CATEGORIES = [
  // INDOOR
  { url: "/se/inomhusvaxter/gronvaxter", label: "Gröna inomhusväxter", category: "tropical" },
  { url: "/se/inomhusvaxter/blommande-inomhusvaxter", label: "Blommande inomhusväxter", category: "other" },
  { url: "/se/inomhusvaxter/orkideer", label: "Orkidéer", category: "orchid" },
  { url: "/se/inomhusvaxter/kaktus-och-suckulenter", label: "Kaktus & suckulenter", category: "succulent" },
  { url: "/se/inomhusvaxter/luftvaxter-och-mossa", label: "Luftväxter & mossa", category: "other" },
  { url: "/se/inomhusvaxter/palmar-och-tropiska-vaxter", label: "Palmar & tropiska växter", category: "palm" },
  { url: "/se/inomhusvaxter/ormbunkar-och-grasvaxter", label: "Ormbunkar & gräsväxter", category: "fern" },
  // OUTDOOR
  { url: "/se/utomhusvaxter/perenner", label: "Perenner", category: "other" },
  { url: "/se/utomhusvaxter/sommarblommor", label: "Sommarblommor", category: "other" },
  { url: "/se/utomhusvaxter/rosor", label: "Rosor", category: "climbing" },
  { url: "/se/utomhusvaxter/prydnadsbuskar", label: "Prydnadsbuskar", category: "tree" },
  { url: "/se/utomhusvaxter/klangvaxter", label: "Klängväxter", category: "climbing" },
  { url: "/se/utomhusvaxter/hackvaxter", label: "Häckväxter", category: "tree" },
  { url: "/se/utomhusvaxter/prydnadstrad", label: "Prydnadsträd", category: "tree" },
  { url: "/se/utomhusvaxter/fruktbuskar-och-frukttrad", label: "Fruktbuskar & fruktträd", category: "tree" },
  { url: "/se/utomhusvaxter/gronsaksfroer-och-plantor", label: "Grönsaksfrön & plantor", category: "herb" },
  { url: "/se/utomhusvaxter/kryddvaxter", label: "Kryddväxter", category: "herb" },
  { url: "/se/utomhusvaxter/blomsterlok", label: "Blomsterlök", category: "other" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Normalize price from Plantagen format.
 * Plantagen shows prices WITHOUT decimals as integers in öre:
 *   16990 = 169.90 SEK
 *   9990  = 99.90 SEK
 *   39990 = 399.90 SEK
 */
function normalizePrice(raw) {
  if (!raw && raw !== 0) return null;
  const n = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.]/g, "")) : raw;
  if (isNaN(n)) return null;
  // Heuristic: if price looks unrealistically large (>= 10000 after parsing as SEK), divide by 100
  if (n >= 10000) return parseFloat((n / 100).toFixed(2));
  if (n >= 1000) return parseFloat((n / 100).toFixed(2));
  // Already in SEK
  return parseFloat(n.toFixed(2));
}

async function fetchCategoryProducts(base44, cat, maxRetries = 3) {
  const fullUrl = BASE_URL + cat.url;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a web scraper. Visit this exact Plantagen.se category page and extract ALL plant product listings shown:

URL: ${fullUrl}
Category: "${cat.label}"

For each product extract:
- name: Swedish product name (e.g. "Lavendel 'Felice'")
- scientific_name: Latin/scientific name if shown (e.g. "Lavandula angustifolia 'Felice'"), or null
- price: current price AS A NUMBER IN SEK (e.g. if shown as "16990" that means 169.90 SEK - divide by 100 if it looks like öre)
- regular_price: original price before discount as number in SEK, or null if no discount
- discount_label: discount label text if any (e.g. "30%", "2 för 120,-"), or null
- size_info: size string like "Ø15 cm", "Höjd 35 cm", "Ø17 cm" etc., or null
- color: color if shown (e.g. "Blå", "Rosa"), or null
- product_url: full product URL starting with https://plantagen.se
- image_url: full image URL from media.crystallize.com or plantagen.se CDN
- availability: "in_stock" if available in stores, "out_of_stock" if not available, "limited" if limited

IMPORTANT: Prices on Plantagen are shown WITHOUT comma/period separators as integers in öre.
So 16990 = 169.90 SEK, 9990 = 99.90 SEK, 39990 = 399.90 SEK. Convert accordingly.

Extract 15-30 products. Return valid JSON: { "products": [...] }`,
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
                  discount_label: { type: "string" },
                  size_info: { type: "string" },
                  color: { type: "string" },
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
        await sleep(attempt * 10000);
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
    const batchSize = body.batch_size || 4;
    const batchIndex = typeof body.batch === "number" ? body.batch : null;
    const filterCategories = body.categories || null;

    // 1. Find or create Plantagen seller
    let sellers = await base44.asServiceRole.entities.Seller.filter({ seller_name: SELLER_NAME });
    let seller;
    if (sellers.length > 0) {
      seller = sellers[0];
    } else {
      seller = await base44.asServiceRole.entities.Seller.create({
        seller_name: SELLER_NAME,
        website_url: BASE_URL + "/se",
        country: "Sweden",
        verified_status: true,
        affiliate_program: false,
      });
    }

    let targets = filterCategories
      ? ALL_CATEGORIES.filter((c) => filterCategories.includes(c.category))
      : ALL_CATEGORIES;

    if (batchIndex !== null) {
      const start = batchIndex * batchSize;
      targets = targets.slice(start, start + batchSize);
    }

    const log = await base44.asServiceRole.entities.ScraperLog.create({
      run_type: "manual",
      status: "running",
      started_at: new Date().toISOString(),
    });

    const results = { created: 0, updated: 0, failed: 0, skipped: 0, errors: [] };
    const plantCache = await base44.asServiceRole.entities.Plant.list();

    for (const cat of targets) {
      let products = [];
      try {
        products = await fetchCategoryProducts(base44, cat);
      } catch (err) {
        results.errors.push({ category: cat.label, error: err.message });
        results.failed++;
        await sleep(5000);
        continue;
      }

      for (const p of products) {
        if (!p.name || !p.product_url) {
          results.skipped++;
          continue;
        }

        // Validate URL belongs to Plantagen
        const productUrl = p.product_url.startsWith("http")
          ? p.product_url
          : BASE_URL + p.product_url;

        if (!productUrl.includes("plantagen.se")) {
          results.skipped++;
          continue;
        }

        const rawPrice = p.price;
        const price = normalizePrice(rawPrice);
        if (!price || price <= 0) {
          results.skipped++;
          continue;
        }

        const regularPrice = p.regular_price ? normalizePrice(p.regular_price) : null;
        const now = new Date().toISOString();
        const shipping = DEFAULT_SHIPPING;
        const totalPrice = price + shipping;
        const availability = ["in_stock", "out_of_stock", "limited"].includes(p.availability)
          ? p.availability
          : "in_stock";

        // Parse pot size from size_info
        let potSize = null;
        if (p.size_info) {
          const match = p.size_info.match(/Ø(\d+)\s*cm/i);
          if (match) {
            const cm = parseInt(match[1]);
            const POT_SIZES = [6, 9, 12, 14, 17, 19, 21, 24, 27, 30];
            const closest = POT_SIZES.reduce((a, b) => Math.abs(b - cm) < Math.abs(a - cm) ? b : a);
            potSize = cm >= 30 ? "30cm+" : `${closest}cm`;
          }
        }

        // Check if product already exists (by URL)
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
            shipping_cost: shipping,
            total_price: totalPrice,
            currency: "SEK",
            availability,
            date_checked: now,
          });
          results.updated++;
        } else {
          const plant = await matchOrCreatePlant(
            base44,
            p.name,
            p.scientific_name || null,
            cat.category,
            plantCache
          );

          // Build product title with size/color info
          const productTitle = [p.name, p.size_info, p.color]
            .filter(Boolean)
            .join(", ");

          const newProd = await base44.asServiceRole.entities.Product.create({
            product_title: productTitle,
            plant_id: plant.id,
            seller_id: seller.id,
            price,
            regular_price: regularPrice || undefined,
            currency: "SEK",
            shipping_cost: shipping,
            total_price: totalPrice,
            product_url: productUrl,
            image_url: p.image_url || undefined,
            availability,
            pot_size: potSize || undefined,
            last_checked: now,
          });

          await base44.asServiceRole.entities.PriceHistory.create({
            product_id: newProd.id,
            price,
            shipping_cost: shipping,
            total_price: totalPrice,
            currency: "SEK",
            availability,
            date_checked: now,
          });
          results.created++;
        }

        await sleep(150);
      }

      // Respectful delay between categories
      await sleep(4000);
    }

    await base44.asServiceRole.entities.ScraperLog.update(log.id, {
      status: "completed",
      products_checked: results.created + results.updated,
      products_updated: results.updated,
      products_failed: results.failed,
      completed_at: new Date().toISOString(),
      details: JSON.stringify({
        ...results,
        categories_scraped: targets.length,
        seller_id: seller.id,
      }),
    });

    return Response.json({
      seller_name: SELLER_NAME,
      seller_id: seller.id,
      categories_scraped: targets.length,
      total_categories: ALL_CATEGORIES.length,
      batch_index: batchIndex,
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