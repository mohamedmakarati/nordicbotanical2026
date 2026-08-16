import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const THUNDERBIT_BASE_URL = 'https://openapi.thunderbit.com/openapi/v1';

const VALID_CATEGORIES = ['tropical', 'succulent', 'cactus', 'fern', 'orchid', 'palm', 'herb', 'tree', 'climbing', 'rose', 'other'];

function normalizeAvailability(val) {
  if (!val) return 'in_stock';
  const v = String(val).toLowerCase();
  if (v.includes('out') || v.includes('sold')) return 'out_of_stock';
  if (v.includes('limit') || v.includes('low')) return 'limited';
  if (v.includes('pre') || v.includes('order')) return 'pre_order';
  return 'in_stock';
}

function guessCategory(name, scientific) {
  const text = `${name || ''} ${scientific || ''}`.toLowerCase();
  if (text.includes('cactus') || text.includes('cactaceae') || text.includes('echin') || text.includes('mammillaria') || text.includes('copiapoa') || text.includes('turbinicarpus') || text.includes('euphorbia')) return 'cactus';
  if (text.includes('succulent') || text.includes('aloe') || text.includes('haworthia') || text.includes('sedum') || text.includes('echeveria') || text.includes('kalanchoe')) return 'succulent';
  if (text.includes('orchid') || text.includes('phalaenopsis')) return 'orchid';
  if (text.includes('fern') || text.includes('nephrolepis') || text.includes('asplenium')) return 'fern';
  if (text.includes('palm') || text.includes('strelitzia') || text.includes('trachycarpus') || text.includes('areca')) return 'palm';
  if (text.includes('rose') || text.includes('rosa ')) return 'rose';
  if (text.includes('climb') || text.includes('hoya') || text.includes('pothos') || text.includes('philodendron') && text.includes('climb')) return 'climbing';
  if (text.includes('tree') || text.includes('ficus') || text.includes('syringa')) return 'tree';
  if (text.includes('herb') || text.includes('basil') || text.includes('mint') || text.includes('thyme')) return 'herb';
  if (text.includes('tropical') || text.includes('monstera') || text.includes('alocasia') || text.includes('philodendron') || text.includes('anthurium') || text.includes('calathea') || text.includes('begonia')) return 'tropical';
  return 'other';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = Deno.env.get('THUNDERBIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'THUNDERBIT_API_KEY not configured' }, { status: 500 });

    const { seller_id, seller_name, url, renderMode = 'full' } = await req.json();
    if (!seller_id || !seller_name || !url) {
      return Response.json({ error: 'seller_id, seller_name, and url required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Step 1: distill page to markdown (full render for JS-heavy sites)
    const distillRes = await fetch(`${THUNDERBIT_BASE_URL}/distill`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, renderMode, countryCode: 'SE' }),
    });
    const distillData = await distillRes.json();
    const markdown = distillData?.markdown || distillData?.data?.markdown || '';
    if (!markdown) {
      return Response.json({ error: 'Could not distill page', detail: distillData, seller: seller_name }, { status: 422 });
    }

    // Step 2: use LLM to extract products from markdown
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract all plant products from the following webpage markdown. Return a JSON array of product objects with these fields: product_name (string), scientific_name (string, latin name if shown), price (number in SEK, convert from EUR by multiplying by 11), regular_price (number, only if discounted and different from price), product_url (string, full URL), image_url (string, full URL - skip placeholder/gif images), availability ("in_stock", "out_of_stock", "limited", or "pre_order"), currency (default "SEK"). Only include real products with actual prices. Do not include navigation items, categories, or collections.\n\nMarkdown:\n${markdown.slice(0, 12000)}`,
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
                price: { type: "number" },
                regular_price: { type: "number" },
                product_url: { type: "string" },
                image_url: { type: "string" },
                availability: { type: "string" },
                currency: { type: "string" }
              }
            }
          }
        }
      }
    });

    const products = llmResult?.products ?? [];

    // Step 3: check for duplicates against existing products
    const existingProducts = await base44.asServiceRole.entities.Product.filter({ seller_id }, '-created_date', 500);
    const existingUrls = new Set(existingProducts.map(p => p.product_url));

    // Step 4: save to ScraperResult as pending
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const records = [];
    for (const p of products) {
      // Skip placeholder/gif images
      if (p.image_url && p.image_url.startsWith('data:image/gif')) {
        p.image_url = '';
      }
      // Skip if regular_price equals price
      if (p.regular_price && p.regular_price === p.price) {
        p.regular_price = null;
      }
      // Convert EUR to SEK if currency is EUR
      let price = p.price;
      let regularPrice = p.regular_price || null;
      if (p.currency === 'EUR') {
        price = Math.round(price * 11);
        if (regularPrice) regularPrice = Math.round(regularPrice * 11);
      }
      const isDup = p.product_url && existingUrls.has(p.product_url);
      records.push({
        job_id: jobId,
        seller_name,
        seller_id,
        product_name: p.product_name || 'Unknown',
        scientific_name: p.scientific_name && p.scientific_name !== 'N/A' ? p.scientific_name : null,
        product_url: p.product_url || '',
        image_url: p.image_url || '',
        price,
        regular_price: regularPrice,
        currency: 'SEK',
        availability: normalizeAvailability(p.availability),
        category: guessCategory(p.product_name, p.scientific_name),
        is_duplicate: isDup,
        status: 'pending',
        last_checked: now
      });
    }

    let saved = 0;
    if (records.length > 0) {
      const BATCH = 25;
      for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        await base44.asServiceRole.entities.ScraperResult.bulkCreate(batch);
        saved += batch.length;
      }
    }

    return Response.json({
      seller: seller_name,
      url,
      productsFound: products.length,
      saved,
      duplicates: records.filter(r => r.is_duplicate).length,
      jobId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});