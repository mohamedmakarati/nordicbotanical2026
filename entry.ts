import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      query = "",
      plant_name,
      category,
      max_price,
      seller_name,
      country,
      pot_size,
      free_shipping,
      availability,
      limit = 10,
    } = body;

    // Fetch data in parallel
    const [products, plants, sellers] = await Promise.all([
      base44.asServiceRole.entities.Product.list("-last_checked", 500),
      base44.asServiceRole.entities.Plant.list(),
      base44.asServiceRole.entities.Seller.list(),
    ]);

    const plantsMap = Object.fromEntries(plants.map((p) => [p.id, p]));
    const sellersMap = Object.fromEntries(sellers.map((s) => [s.id, s]));

    const q = (query || plant_name || "").toLowerCase().trim();

    let filtered = products.filter((prod) => {
      const plant = plantsMap[prod.plant_id] || {};
      const seller = sellersMap[prod.seller_id] || {};

      // Text match on name
      if (q) {
        const nameMatch =
          prod.product_title?.toLowerCase().includes(q) ||
          plant.plant_name?.toLowerCase().includes(q) ||
          plant.scientific_name?.toLowerCase().includes(q);
        if (!nameMatch) return false;
      }

      // Category filter
      if (category && plant.category) {
        if (!plant.category.toLowerCase().includes(category.toLowerCase())) return false;
      }

      // Max price filter (on total price)
      const total = (prod.price || 0) + (prod.shipping_cost || 0);
      if (max_price && total > max_price) return false;

      // Seller name filter
      if (seller_name) {
        if (!seller.seller_name?.toLowerCase().includes(seller_name.toLowerCase())) return false;
      }

      // Country filter
      if (country) {
        if (!seller.country?.toLowerCase().includes(country.toLowerCase())) return false;
      }

      // Pot size filter
      if (pot_size && prod.pot_size) {
        if (prod.pot_size !== pot_size) return false;
      }

      // Free shipping filter
      if (free_shipping && (prod.shipping_cost || 0) > 0) return false;

      // Availability filter
      if (availability && prod.availability) {
        if (prod.availability !== availability) return false;
      }

      return true;
    });

    // Sort by total price ascending
    filtered.sort((a, b) => {
      const totalA = (a.price || 0) + (a.shipping_cost || 0);
      const totalB = (b.price || 0) + (b.shipping_cost || 0);
      return totalA - totalB;
    });

    // Limit results
    const limited = filtered.slice(0, Math.min(limit, 20));

    // Enrich results
    const results = limited.map((prod) => {
      const plant = plantsMap[prod.plant_id] || {};
      const seller = sellersMap[prod.seller_id] || {};
      return {
        id: prod.id,
        product_title: prod.product_title,
        plant_name: plant.plant_name || prod.product_title,
        scientific_name: plant.scientific_name || null,
        category: plant.category || null,
        image_url: prod.image_url || plant.image_url || null,
        price: prod.price,
        regular_price: prod.regular_price || null,
        currency: prod.currency || "SEK",
        shipping_cost: prod.shipping_cost || 0,
        total_price: (prod.price || 0) + (prod.shipping_cost || 0),
        pot_size: prod.pot_size || null,
        availability: prod.availability || "in_stock",
        seller_name: seller.seller_name || "Okänd butik",
        seller_country: seller.country || null,
        product_url: prod.product_url || "#",
        last_checked: prod.last_checked || prod.updated_date,
      };
    });

    return Response.json({
      results,
      total_found: filtered.length,
      query: q,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});