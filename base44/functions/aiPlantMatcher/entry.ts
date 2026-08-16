/**
 * AI Plant Matcher
 *
 * Takes a list of products and uses AI to:
 * 1. Identify the scientific name of each plant
 * 2. Group products that are the same plant (sold by different stores)
 * 3. Create/update Plant entity records
 * 4. Link products to their canonical Plant record
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { product_ids, batch_size = 20 } = body;

    // Load products that have no plant_id yet (unmatched)
    let products;
    if (product_ids?.length) {
      products = await base44.asServiceRole.entities.Product.filter({ id: { $in: product_ids } });
    } else {
      const all = await base44.asServiceRole.entities.Product.list('-created_date', 200);
      products = all.filter((p) => !p.plant_id);
    }

    if (!products.length) {
      return Response.json({ message: 'No unmatched products found.', matched: 0, created: 0 });
    }

    // Load existing plants for deduplication
    const existingPlants = await base44.asServiceRole.entities.Plant.list();
    const existingByScientific = Object.fromEntries(
      existingPlants
        .filter((p) => p.scientific_name)
        .map((p) => [p.scientific_name.toLowerCase().trim(), p])
    );

    const stats = { matched: 0, created: 0, failed: 0 };
    const logs = [];

    // Process in batches to stay within AI token limits
    for (let i = 0; i < products.length; i += batch_size) {
      const batch = products.slice(i, i + batch_size);

      const productList = batch.map((p, idx) => ({
        idx,
        id: p.id,
        title: p.product_title || '',
      }));

      let aiResult;
      try {
        aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a botanist and plant taxonomy expert. 

I have a list of plant products sold in Nordic garden stores. For each product, identify:
1. The scientific name (Latin binomial, e.g. "Lavandula angustifolia")
2. The common Swedish or English name
3. The plant category (one of: tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, other)
4. A short 1-sentence description in Swedish

Products:
${JSON.stringify(productList, null, 2)}

Return a JSON array with one object per product in the SAME ORDER as input:
[
  {
    "idx": 0,
    "scientific_name": "...",
    "common_name": "...",
    "category": "...",
    "description": "..."
  }
]

Rules:
- If you cannot identify the plant, use null for scientific_name
- scientific_name must be a valid Latin binomial
- category must be exactly one of the allowed values
- description should be 1 short sentence in Swedish`,
          response_json_schema: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    idx: { type: 'number' },
                    scientific_name: { type: 'string' },
                    common_name: { type: 'string' },
                    category: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        });
      } catch (err) {
        logs.push({ error: `AI batch ${i} failed: ${err.message}` });
        stats.failed += batch.length;
        continue;
      }

      const identifications = aiResult?.results || [];

      for (const id of identifications) {
        const product = batch[id.idx];
        if (!product) continue;

        const sciName = id.scientific_name?.trim().toLowerCase();

        if (!sciName) {
          logs.push({ product_id: product.id, status: 'unidentified', title: product.product_title });
          stats.failed++;
          continue;
        }

        // Check if plant already exists
        let plant = existingByScientific[sciName];

        if (!plant) {
          // Create new Plant record
          plant = await base44.asServiceRole.entities.Plant.create({
            plant_name: id.common_name || id.scientific_name,
            scientific_name: id.scientific_name,
            category: id.category || 'other',
            description: id.description || null,
          });
          existingByScientific[sciName] = plant;
          stats.created++;
          logs.push({ product_id: product.id, status: 'new_plant', scientific_name: id.scientific_name });
        } else {
          stats.matched++;
          logs.push({ product_id: product.id, status: 'matched', scientific_name: id.scientific_name, plant_id: plant.id });
        }

        // Link product → plant
        await base44.asServiceRole.entities.Product.update(product.id, { plant_id: plant.id });
      }
    }

    return Response.json({
      message: 'AI matching complete',
      total_processed: products.length,
      plants_matched: stats.matched,
      plants_created: stats.created,
      failed: stats.failed,
      log: logs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});