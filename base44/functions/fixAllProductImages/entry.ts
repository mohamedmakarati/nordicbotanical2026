import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8'
};

// Known shared/placeholder image patterns to reject
const PLACEHOLDER_PATTERNS = [
  /contentassets\/medias/i,
  /contentassets\/3dc4696dcc954bdbb/i,
  /\/kategoribiller\//i,
  /\/kategoribilder\//i,
  /sys_master\/rootmedia/i,
  /placeholder/i,
  /no-image/i,
  /default-product/i,
  /\/assets\/Logo\//i,
  /logo/i,
  /favicon/i,
  /\/shared\//i,
  /\/static\//i
];

function isPlaceholder(url) {
  if (!url) return true;
  return PLACEHOLDER_PATTERNS.some(p => p.test(url));
}

// Extract product image from JSON-LD structured data (schema.org/Product)
function extractProductImage(html) {
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
      if (parsed['@type'] === 'Product' && parsed.image) {
        const imgs = Array.isArray(parsed.image) ? parsed.image : [parsed.image];
        const img = imgs.find(u => typeof u === 'string' && u.startsWith('http') && !isPlaceholder(u));
        if (img) return img;
      }
    } catch (e) { /* skip malformed */ }
  }
  return null;
}

// Fallback: og:image meta tag (only if not a placeholder)
function extractOgImage(html) {
  const m = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (m && !isPlaceholder(m[1])) return m[1];
  return null;
}

async function fixOne(base44, product) {
  if (!product.product_url) return { skipped: true, reason: 'no_url', id: product.id };
  try {
    const res = await fetch(product.product_url, { headers: FETCH_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { error: `HTTP ${res.status}`, id: product.id };
    const html = await res.text();

    const newImg = extractProductImage(html) || extractOgImage(html);
    const now = new Date().toISOString();

    if (!newImg || newImg === product.image_url) {
      await base44.asServiceRole.entities.Product.update(product.id, { last_checked: now });
      return { skipped: true, reason: 'no_image', id: product.id };
    }

    await base44.asServiceRole.entities.Product.update(product.id, { image_url: newImg, last_checked: now });
    return { fixed: true, id: product.id, title: product.product_title?.slice(0, 30), new: newImg };
  } catch (e) {
    return { error: e.message, id: product.id };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin or service-role (scheduled automation has no user)
    const isAuthed = await base44.auth.isAuthenticated().catch(() => false);
    if (isAuthed) {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch all products across all sellers (filter with high limit)
    const allProducts = await base44.asServiceRole.entities.Product.filter({}, '-created_date', 2000);
    const needsFix = allProducts
      .filter(p => p.product_url && (!p.image_url || isPlaceholder(p.image_url)))
      .sort((a, b) => {
        const aT = a.last_checked ? new Date(a.last_checked).getTime() : 0;
        const bT = b.last_checked ? new Date(b.last_checked).getTime() : 0;
        return aT - bT;
      })
      .slice(0, 30);

    if (needsFix.length === 0) {
      return Response.json({ message: 'No products need image fixing', processed: 0, fixed: 0 });
    }

    const results = [];
    const CONCURRENCY = 3;
    const BATCH_DELAY_MS = 2000;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < needsFix.length; i += CONCURRENCY) {
      const batch = needsFix.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(p => fixOne(base44, p)));
      results.push(...batchResults);
      if (i + CONCURRENCY < needsFix.length) await sleep(BATCH_DELAY_MS);
    }

    const fixed = results.filter(r => r.fixed).length;
    const errors = results.filter(r => r.error);

    return Response.json({
      processed: needsFix.length,
      fixed,
      skipped: results.filter(r => r.skipped).length,
      errors: errors.length,
      errorDetails: errors.slice(0, 3),
      fixedSamples: results.filter(r => r.fixed).slice(0, 3)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});