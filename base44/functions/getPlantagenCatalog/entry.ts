import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Find the Plantagen seller
    const sellers = await base44.asServiceRole.entities.Seller.filter({ seller_name: "Plantagen" });
    if (!sellers.length) return Response.json({ products: [], total: 0, categories: [] });
    const sellerId = sellers[0].id;

    // Paginate through ALL Plantagen products using skip-based pagination
    const slim = [];
    for (let skip = 0; skip < 20000; skip += 500) {
      const batch = await base44.asServiceRole.entities.Product.filter({ seller_id: sellerId }, "-id", 500, skip);
      if (!batch.length) break;
      for (const p of batch) {
        slim.push({
          id: p.id,
          product_title: p.product_title,
          price: p.price,
          regular_price: p.regular_price || null,
          currency: p.currency || "SEK",
          shipping_cost: p.shipping_cost || 0,
          product_url: p.product_url || "",
          image_url: p.image_url || "",
          availability: p.availability || "in_stock",
          article_number: p.article_number || "",
          category: p.category || "Övrigt",
        });
      }
      if (batch.length < 500) break;
    }

    // Category counts
    const counts = {};
    for (const p of slim) counts[p.category] = (counts[p.category] || 0) + 1;
    const categories = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));

    return Response.json({ products: slim, total: slim.length, categories });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}