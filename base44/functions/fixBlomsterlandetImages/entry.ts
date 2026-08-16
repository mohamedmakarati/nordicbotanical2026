import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BLOMSTERLANDET_SELLER_ID = '6a27acfc51a85a2e18b83870';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8'
};

// Extract product image from JSON-LD (schema.org/Product), then og:image meta tag.
function extractProductImage(html) {
  // 1. JSON-LD Product image
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
      if (parsed['@type'] === 'Product' && parsed.image) {
        const imgs = Array.isArray(parsed.image) ? parsed.image : [parsed.image];
        const img = imgs.find(u => typeof u === 'string' && u.startsWith('http'));
        if (img) return img;
      }
    } catch (e) { /* skip malformed */ }
  }
  // 2. og:image meta tag — skip category placeholder images
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1].startsWith('http') && !ogMatch[1].includes('kategoribilder')) return ogMatch[1];
  return null;
}

async function fixOne(base44, product, duplicateUrls) {
  if (!product.product_url) return { skipped: true, reason: 'no_product_url' };
  try {
    const res = await fetch(product.product_url, { headers: FETCH_HEADERS, redirect: 'follow' });
    if (!res.ok) return { error: `HTTP ${res.status}`, id: product.id };
    const html = await res.text();

    const newImg = extractProductImage(html);
    // Skip shared placeholder images (contentassets/medias paths used across many products)
    if (newImg && duplicateUrls.has(newImg) && (newImg.includes('contentassets') || newImg.includes('medias/sys_master'))) {
      await base44.asServiceRole.entities.Product.update(product.id, { image_url: null, last_checked: new Date().toISOString() });
      return { skipped: true, reason: 'shared_placeholder', id: product.id };
    }
    if (!newImg || newImg === product.image_url) {
      await base44.asServiceRole.entities.Product.update(product.id, { last_checked: new Date().toISOString() });
      return { skipped: true, reason: 'no_new_image', id: product.id };
    }

    await base44.asServiceRole.entities.Product.update(product.id, { image_url: newImg, last_checked: new Date().toISOString() });
    return { fixed: true, id: product.id, title: product.product_title?.slice(0, 30), new: newImg };
  } catch (e) {
    return { error: e.message, id: product.id };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allProducts = await base44.asServiceRole.entities.Product.filter(
      { seller_id: BLOMSTERLANDET_SELLER_ID }, '-created_date', 500
    );

    // Find duplicate image URLs
    const urlCounts = {};
    for (const p of allProducts) {
      const u = p.image_url || '';
      urlCounts[u] = (urlCounts[u] || 0) + 1;
    }
    const duplicateUrls = new Set(Object.entries(urlCounts).filter(([, c]) => c > 1).map(([u]) => u));

    // Process products with null, duplicate, or non-blomsterlandet images
    const needsFix = allProducts.filter(p =>
      !p.image_url ||
      !p.image_url.includes('blomsterlandet.se') ||
      duplicateUrls.has(p.image_url)
    ).sort((a, b) => {
      const aT = a.last_checked ? new Date(a.last_checked).getTime() : 0;
      const bT = b.last_checked ? new Date(b.last_checked).getTime() : 0;
      return aT - bT;
    }).slice(0, 60);

    const results = [];
    const CONCURRENCY = 3;
    const BATCH_DELAY_MS = 1200;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < needsFix.length; i += CONCURRENCY) {
      const batch = needsFix.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(p => fixOne(base44, p, duplicateUrls)));
      results.push(...batchResults);
      if (i + CONCURRENCY < needsFix.length) await sleep(BATCH_DELAY_MS);
    }

    const fixed = results.filter(r => r.fixed).length;
    const errors = results.filter(r => r.error);
    const skipped = results.filter(r => r.skipped);

    return Response.json({
      totalCatalog: allProducts.length,
      duplicateImageProducts: allProducts.filter(p => duplicateUrls.has(p.image_url)).length,
      nullImages: allProducts.filter(p => !p.image_url).length,
      processed: needsFix.length,
      fixed,
      skipped: skipped.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 5),
      fixedSamples: results.filter(r => r.fixed).slice(0, 5)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});