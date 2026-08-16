import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id || null;

    const query = jobId
      ? { job_id: jobId, status: 'pending' }
      : { status: 'pending' };

    const pending = await base44.asServiceRole.entities.ScraperResult.filter(query, '-created_date', 200);

    let approved = 0;
    let failed = 0;
    let skipped = 0;

    for (const r of pending) {
      // Skip results missing required fields for Product
      if (!r.seller_id || !r.price || !r.product_url) {
        skipped++;
        try {
          await base44.asServiceRole.entities.ScraperResult.update(r.id, {
            status: 'rejected',
            admin_notes: 'Automatiskt avvisad: saknar seller_id, price eller product_url',
          });
        } catch (e) {}
        continue;
      }
      try {
        // Find or create plant
        let plantId = null;
        const plants = await base44.asServiceRole.entities.Plant.filter({ plant_name: r.product_name });
        if (plants.length > 0) {
          plantId = plants[0].id;
        } else {
          const plant = await base44.asServiceRole.entities.Plant.create({
            plant_name: r.product_name,
            scientific_name: r.scientific_name || null,
            category: r.category || 'other',
            description: r.description || null,
          });
          plantId = plant.id;
        }

        // Create product
        const product = await base44.asServiceRole.entities.Product.create({
          product_title: r.product_name,
          plant_id: plantId,
          seller_id: r.seller_id,
          price: r.price,
          regular_price: r.regular_price || undefined,
          currency: r.currency || 'SEK',
          shipping_cost: 49,
          total_price: (r.price || 0) + 49,
          product_url: r.product_url,
          image_url: r.image_url || undefined,
          availability: r.availability || 'in_stock',
          category: r.category || undefined,
          pot_size: r.pot_size || undefined,
          last_checked: new Date().toISOString(),
        });

        // Mark scraper result as approved
        await base44.asServiceRole.entities.ScraperResult.update(r.id, {
          status: 'approved',
          imported_product_id: product.id,
        });

        // Update job counts
        if (r.job_id) {
          try {
            const jobs = await base44.asServiceRole.entities.ScraperJob.filter({ id: r.job_id });
            if (jobs[0]) {
              await base44.asServiceRole.entities.ScraperJob.update(jobs[0].id, {
                products_approved: (jobs[0].products_approved || 0) + 1,
                products_pending: Math.max(0, (jobs[0].products_pending || 1) - 1),
              });
            }
          } catch (e) {
            // job not found, continue
          }
        }

        approved++;
      } catch (e) {
        failed++;
      }
    }

    return Response.json({ approved, failed, skipped, total: pending.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});