/**
 * NordicBotanical Full Scraper Orchestrator
 *
 * - Reads ScrapeTarget records to know what to scrape
 * - Checks robots.txt for every domain
 * - Detects duplicates before inserting
 * - Logs everything to ScraperLog entity
 * - Triggers AI plant matcher after scraping
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RATE_LIMIT_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BOT_UA = 'NordicBotanicalBot/1.0 (+https://nordicbotanical.com/bot)';

// ── robots.txt ────────────────────────────────────────────────────────────────
const robotsCache = {};
async function isAllowedByRobots(baseUrl, path) {
  if (robotsCache[baseUrl] === undefined) {
    try {
      const res = await fetch(`${baseUrl}/robots.txt`, {
        headers: { 'User-Agent': BOT_UA },
        signal: AbortSignal.timeout(5000),
      });
      robotsCache[baseUrl] = res.ok ? await res.text() : '';
    } catch {
      robotsCache[baseUrl] = '';
    }
  }
  const text = robotsCache[baseUrl];
  if (!text) return true;

  const lines = text.split('\n').map((l) => l.trim().toLowerCase());
  let active = false;
  const disallowed = [];

  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      active = line.includes('nordicbotanicalbot') || line.includes('*');
    } else if (active && line.startsWith('disallow:')) {
      const p = line.replace('disallow:', '').trim();
      if (p) disallowed.push(p);
    }
  }

  return !disallowed.some((p) => path.startsWith(p));
}

// ── Extract product links from a category/sitemap page ───────────────────────
async function extractProductLinks(url, targetType) {
  const origin = new URL(url).origin;
  const path = new URL(url).pathname;

  if (!(await isAllowedByRobots(origin, path))) {
    return { links: [], blocked: true };
  }

  await sleep(RATE_LIMIT_MS);

  const res = await fetch(url, {
    headers: { 'User-Agent': BOT_UA, Accept: 'text/html,application/xml', 'Accept-Language': 'sv,en' },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) return { links: [], blocked: false, error: `HTTP ${res.status}` };

  const body = await res.text();

  if (targetType === 'sitemap' || url.endsWith('.xml')) {
    // Parse sitemap XML
    const locs = [...body.matchAll(/<loc>\s*(https?:[^<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    const productLinks = locs.filter((l) =>
      l.includes('/product') || l.includes('/vaxt') || l.includes('/plant') || l.includes('/item')
    );
    return { links: productLinks.slice(0, 50) };
  }

  if (targetType === 'rss_feed') {
    const rssLinks = [...body.matchAll(/<link>(https?:[^<]+)<\/link>/gi)].map((m) => m[1].trim());
    return { links: rssLinks.slice(0, 50) };
  }

  // Category page: extract product anchor hrefs
  const hrefs = [...body.matchAll(/href="(https?:\/\/[^"]+)"/gi)]
    .map((m) => m[1])
    .filter((h) => {
      const lower = h.toLowerCase();
      return (
        lower.includes('/product') ||
        lower.includes('/p/') ||
        lower.includes('/vaxt') ||
        lower.includes('/plant') ||
        lower.includes('/blomma')
      );
    });

  const unique = [...new Set(hrefs)];
  return { links: unique.slice(0, 30) };
}

// ── Scrape a single product page ─────────────────────────────────────────────
async function scrapeProductPage(url) {
  const origin = new URL(url).origin;
  const path = new URL(url).pathname;

  if (!(await isAllowedByRobots(origin, path))) return { blocked: true };
  await sleep(RATE_LIMIT_MS);

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': BOT_UA, Accept: 'text/html', 'Accept-Language': 'sv,en,no,da' },
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    return { error: e.message };
  }

  if (!res.ok) return { error: `HTTP ${res.status}` };
  const html = await res.text();

  const ogTitle   = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogImage   = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] || null;
  const ogDesc    = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || null;

  let price = null, regularPrice = null, currency = 'SEK', availability = 'in_stock', name = ogTitle, image = ogImage;

  const jsonLdBlocks = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data)
        ? data.find((d) => d['@type'] === 'Product')
        : data['@type'] === 'Product' ? data : null;

      if (product) {
        name = product.name || name;
        image = (Array.isArray(product.image) ? product.image[0] : product.image) || image;
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer) {
          price = parseFloat(offer.price) || null;
          regularPrice = parseFloat(offer.highPrice || offer.priceBeforeDiscount) || null;
          currency = offer.priceCurrency || 'SEK';
          const avail = (offer.availability || '').toLowerCase();
          if (avail.includes('instock')) availability = 'in_stock';
          else if (avail.includes('outofstock')) availability = 'out_of_stock';
          else if (avail.includes('limited')) availability = 'limited';
          else if (avail.includes('preorder')) availability = 'pre_order';
        }
        break;
      }
    } catch { /* malformed JSON-LD */ }
  }

  // Pot size heuristic
  const potMatch = html.match(/(\d+)\s*cm\s*(kruka|pot|Ø)/i);
  const potSize = potMatch ? `${potMatch[1]}cm` : null;

  return {
    url,
    name: name?.slice(0, 200) || null,
    price,
    regular_price: regularPrice,
    currency,
    availability,
    image_url: image,
    description: ogDesc?.slice(0, 500) || null,
    pot_size: potSize,
    last_checked: new Date().toISOString(),
  };
}

// ── Duplicate detection ───────────────────────────────────────────────────────
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch { return url.toLowerCase(); }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const startMs = Date.now();
  let base44;
  let logId = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { run_type = 'manual', target_ids } = body;

    // Create log record
    const logRecord = await base44.asServiceRole.entities.ScraperLog.create({
      run_type,
      status: 'running',
      total_products: 0,
      updated: 0,
      failed: 0,
      skipped_robots: 0,
      duplicates_found: 0,
      plants_matched: 0,
      new_plants_created: 0,
    });
    logId = logRecord.id;

    // Load targets
    let targets = await base44.asServiceRole.entities.ScrapeTarget.filter({ is_active: true });
    if (target_ids?.length) {
      targets = targets.filter((t) => target_ids.includes(t.id));
    }

    // Load existing products for duplicate detection
    const existingProducts = await base44.asServiceRole.entities.Product.list('-created_date', 500);
    const existingUrlSet = new Set(existingProducts.map((p) => normalizeUrl(p.product_url || '')));

    const sellers = await base44.asServiceRole.entities.Seller.list();
    const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s]));

    const stats = { updated: 0, failed: 0, skipped_robots: 0, duplicates: 0, new_products: 0 };
    const detailLogs = [];

    for (const target of targets) {
      const seller = sellerMap[target.seller_id];
      detailLogs.push({ target: target.target_url, seller: seller?.seller_name });

      // Extract product links from target
      const { links, blocked, error } = await extractProductLinks(target.target_url, target.target_type);

      if (blocked) {
        detailLogs.push({ blocked: target.target_url });
        stats.skipped_robots++;
        continue;
      }
      if (error) {
        detailLogs.push({ error, target: target.target_url });
        stats.failed++;
        continue;
      }

      detailLogs.push({ found_links: links.length, target: target.target_url });

      for (const link of links) {
        const normLink = normalizeUrl(link);

        // Duplicate check
        if (existingUrlSet.has(normLink)) {
          stats.duplicates++;
          detailLogs.push({ duplicate: link });
          continue;
        }

        const scraped = await scrapeProductPage(link);

        if (scraped.blocked) {
          stats.skipped_robots++;
          continue;
        }
        if (scraped.error || !scraped.name || !scraped.price) {
          stats.failed++;
          detailLogs.push({ failed: link, reason: scraped.error || 'missing name/price' });
          continue;
        }

        // Create new product
        await base44.asServiceRole.entities.Product.create({
          product_title: scraped.name,
          price: scraped.price,
          regular_price: scraped.regular_price || null,
          currency: scraped.currency,
          product_url: link,
          image_url: scraped.image_url,
          availability: scraped.availability,
          pot_size: scraped.pot_size,
          seller_id: target.seller_id,
          shipping_cost: 49,
          total_price: scraped.price + 49,
          last_checked: scraped.last_checked,
        });

        existingUrlSet.add(normLink);
        stats.new_products++;
        detailLogs.push({ created: scraped.name, price: scraped.price });
      }

      // Update target's last_scraped
      await base44.asServiceRole.entities.ScrapeTarget.update(target.id, {
        last_scraped: new Date().toISOString(),
        products_found: (target.products_found || 0) + stats.new_products,
      });
    }

    // Also refresh stale existing products (reuse scrapeProductPage)
    const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const stale = existingProducts.filter((p) => p.product_url && (!p.last_checked || p.last_checked < cutoff)).slice(0, 30);

    for (const product of stale) {
      const scraped = await scrapeProductPage(product.product_url);
      if (scraped.error || scraped.blocked) { stats.failed++; continue; }

      const updates = { last_checked: scraped.last_checked };
      if (scraped.price) { updates.price = scraped.price; updates.total_price = scraped.price + (product.shipping_cost || 49); }
      if (scraped.currency) updates.currency = scraped.currency;
      if (scraped.availability) updates.availability = scraped.availability;
      if (scraped.image_url) updates.image_url = scraped.image_url;

      await base44.asServiceRole.entities.Product.update(product.id, updates);

      if (scraped.price) {
        await base44.asServiceRole.entities.PriceHistory.create({
          product_id: product.id,
          price: scraped.price,
          shipping_cost: product.shipping_cost || 49,
          total_price: scraped.price + (product.shipping_cost || 49),
          currency: scraped.currency || product.currency,
          availability: scraped.availability || product.availability,
          date_checked: scraped.last_checked,
        });
      }

      stats.updated++;
    }

    const duration = Date.now() - startMs;

    // Finalise log
    await base44.asServiceRole.entities.ScraperLog.update(logId, {
      status: 'completed',
      total_products: stats.new_products + stats.updated,
      updated: stats.updated,
      failed: stats.failed,
      skipped_robots: stats.skipped_robots,
      duplicates_found: stats.duplicates,
      duration_ms: duration,
      details: JSON.stringify(detailLogs.slice(-100)),
    });

    return Response.json({
      message: 'Scraper run complete',
      run_type,
      duration_ms: duration,
      new_products: stats.new_products,
      updated: stats.updated,
      failed: stats.failed,
      duplicates_skipped: stats.duplicates,
      skipped_robots: stats.skipped_robots,
      log_id: logId,
    });
  } catch (error) {
    if (logId) {
      const base44b = createClientFromRequest(req);
      await base44b.asServiceRole.entities.ScraperLog.update(logId, {
        status: 'failed',
        error_message: error.message,
        duration_ms: Date.now() - startMs,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});