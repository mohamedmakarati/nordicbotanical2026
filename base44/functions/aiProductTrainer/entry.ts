import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // ── analyze_image_seller: any authenticated user can analyse their plant photo ──
    if (action === 'analyze_image_seller') {
      const { image_url } = body;

      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert botanist and Nordic plant marketplace specialist.
Analyze this plant photo and generate a complete product listing.
Be specific. If uncertain, give your best estimate.

Return these fields:
- plant_name: common Swedish name preferred, fallback to English
- scientific_name: Latin binomial (null if truly unknown)
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, rose, other]
- condition: one of [excellent, good, fair, needs_care]
- pot_size: estimated diameter if pot is visible (e.g. "12cm"), null otherwise
- product_title: compelling Swedish auction title, max 60 chars
- description: 2-3 sentence Swedish product description highlighting notable features and condition
- care_info: concise Swedish care tips (watering, light, temperature) in 2-3 sentences
- suggested_price_sek: fair market price in SEK as a number
- auction_starting_price_sek: good starting bid (typically 40-60% of suggested price)
- seo_keywords: array of 5-8 Swedish SEO keyword strings relevant to this plant
- confidence: your confidence level 0-100`,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            plant_name: { type: 'string' },
            scientific_name: { type: 'string' },
            category: { type: 'string' },
            condition: { type: 'string' },
            pot_size: { type: 'string' },
            product_title: { type: 'string' },
            description: { type: 'string' },
            care_info: { type: 'string' },
            suggested_price_sek: { type: 'number' },
            auction_starting_price_sek: { type: 'number' },
            seo_keywords: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' }
          }
        }
      });

      return Response.json({ success: true, analysis });
    }

    // From here, only admins
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── analyze_file: extract all products from uploaded CSV/Excel/JSON ───────
    if (action === 'analyze_file') {
      const { file_url, file_name } = body;

      const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  scientific_name: { type: 'string' },
                  seller: { type: 'string' },
                  price: { type: 'number' },
                  regular_price: { type: 'number' },
                  discount_percent: { type: 'number' },
                  product_url: { type: 'string' },
                  image_url: { type: 'string' },
                  category: { type: 'string' },
                  pot_size: { type: 'string' },
                  availability: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (extracted.status !== 'success' || !extracted.output?.products) {
        return Response.json({ error: extracted.details || 'Could not parse file' }, { status: 400 });
      }

      const batchId = `batch_${Date.now()}`;
      const products = extracted.output.products;

      const examples = products.map((p) => ({
        input_type: 'file_csv',
        uploaded_file_url: file_url,
        file_name: file_name || 'upload',
        batch_id: batchId,
        ai_suggestions: JSON.stringify(p),
        expected_product_name: p.product_name || '',
        expected_scientific_name: p.scientific_name || '',
        expected_category: p.category || '',
        expected_price: p.price || 0,
        expected_regular_price: p.regular_price || null,
        expected_seller: p.seller || '',
        expected_product_url: p.product_url || '',
        expected_image_url: p.image_url || '',
        expected_pot_size: p.pot_size || '',
        expected_availability: p.availability || 'in_stock',
        expected_description: p.description || '',
        status: 'pending',
        approved_by_admin: false,
        products_in_file: products.length
      }));

      await base44.asServiceRole.entities.AITrainingExample.bulkCreate(examples);

      return Response.json({ success: true, batch_id: batchId, count: examples.length });
    }

    // ── analyze_image: AI vision analysis of a plant photo ───────────────────
    if (action === 'analyze_image') {
      const { image_url } = body;

      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert botanist and plant marketplace specialist for Scandinavia.
Analyze this plant photo and return structured product data.
Be specific. If uncertain, give your best estimate.

Fields to return:
- plant_name: common name (Swedish preferred)
- scientific_name: Latin binomial
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, other]
- condition: one of [excellent, good, fair, needs_care]
- pot_size: estimated diameter if pot is visible (e.g. "12cm"), null if not visible
- suggested_title: compelling Swedish product title (max 60 chars)
- suggested_description: 2-3 sentences in Swedish highlighting key features
- price_min: estimated min price SEK
- price_max: estimated max price SEK
- confidence: your confidence 0-100`,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            plant_name: { type: 'string' },
            scientific_name: { type: 'string' },
            category: { type: 'string' },
            condition: { type: 'string' },
            pot_size: { type: 'string' },
            suggested_title: { type: 'string' },
            suggested_description: { type: 'string' },
            price_min: { type: 'number' },
            price_max: { type: 'number' },
            confidence: { type: 'number' }
          }
        }
      });

      const example = await base44.asServiceRole.entities.AITrainingExample.create({
        input_type: 'image',
        image_url,
        ai_suggestions: JSON.stringify(analysis),
        expected_product_name: analysis.plant_name || '',
        expected_scientific_name: analysis.scientific_name || '',
        expected_category: analysis.category || '',
        expected_pot_size: analysis.pot_size || '',
        expected_description: analysis.suggested_description || '',
        status: 'pending',
        approved_by_admin: false
      });

      return Response.json({ success: true, analysis, example_id: example.id });
    }

    // ── update_example: save admin corrections/status ─────────────────────────
    if (action === 'update_example') {
      const { example_id, updates } = body;
      await base44.asServiceRole.entities.AITrainingExample.update(example_id, {
        ...updates,
        admin_correction: updates.admin_correction || JSON.stringify(updates)
      });
      return Response.json({ success: true });
    }

    // ── import_product: after approval, save to Products/Plants/Sellers ───────
    if (action === 'import_product') {
      const { example_id, product_data } = body;

      // Detect duplicates by product_url
      if (product_data.product_url) {
        const existing = await base44.asServiceRole.entities.Product.filter({ product_url: product_data.product_url });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.AITrainingExample.update(example_id, {
            status: 'duplicate',
            duplicate_of_product_id: existing[0].id
          });
          return Response.json({ success: true, duplicate: true, existing_id: existing[0].id });
        }
      }

      // Match or create Plant
      let plantId = null;
      if (product_data.plant_name || product_data.scientific_name) {
        const existingPlants = await base44.asServiceRole.entities.Plant.filter({});
        const match = existingPlants.find((p) =>
          (product_data.scientific_name && p.scientific_name?.toLowerCase() === product_data.scientific_name?.toLowerCase()) ||
          (product_data.plant_name && p.plant_name?.toLowerCase() === product_data.plant_name?.toLowerCase())
        );
        if (match) {
          plantId = match.id;
        } else {
          const newPlant = await base44.asServiceRole.entities.Plant.create({
            plant_name: product_data.plant_name || product_data.product_title,
            scientific_name: product_data.scientific_name || null,
            category: product_data.category || 'other',
            description: product_data.description || null,
            image_url: product_data.image_url || null
          });
          plantId = newPlant.id;
        }
      }

      // Create product
      const newProduct = await base44.asServiceRole.entities.Product.create({
        product_title: product_data.product_title || product_data.plant_name,
        price: product_data.price || 0,
        regular_price: product_data.regular_price || null,
        currency: 'SEK',
        product_url: product_data.product_url || '#',
        image_url: product_data.image_url || null,
        pot_size: product_data.pot_size || null,
        availability: product_data.availability || 'in_stock',
        seller_id: product_data.seller_id || '',
        plant_id: plantId,
        last_checked: new Date().toISOString(),
        shipping_cost: product_data.shipping_cost || 49,
        total_price: (product_data.price || 0) + (product_data.shipping_cost || 49)
      });

      // Save price history
      await base44.asServiceRole.entities.PriceHistory.create({
        product_id: newProduct.id,
        price: product_data.price || 0,
        currency: 'SEK',
        availability: product_data.availability || 'in_stock',
        date_checked: new Date().toISOString()
      });

      // Mark example as imported
      await base44.asServiceRole.entities.AITrainingExample.update(example_id, {
        status: 'imported',
        approved_by_admin: true,
        imported_product_id: newProduct.id
      });

      return Response.json({ success: true, product_id: newProduct.id, plant_id: plantId });
    }

    // ── get_stats: dashboard counts ───────────────────────────────────────────
    if (action === 'get_stats') {
      const all = await base44.asServiceRole.entities.AITrainingExample.list('-created_date', 500);
      const stats = {
        total: all.length,
        pending: all.filter(e => e.status === 'pending').length,
        approved: all.filter(e => e.status === 'approved').length,
        imported: all.filter(e => e.status === 'imported').length,
        rejected: all.filter(e => e.status === 'rejected').length,
        duplicate: all.filter(e => e.status === 'duplicate').length
      };
      return Response.json({ success: true, stats });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});