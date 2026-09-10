import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SELLER_NAME = "Plantagen";
const SELLER_URL = "https://plantagen.se/se";

function cleanTitle(raw) {
  if (!raw) return "";
  let t = String(raw).trim();
  // Strip a leading apostrophe that Plantagen uses to prefix some names
  if (t.startsWith("'")) t = t.slice(1);
  return t.trim();
}

function parsePrice(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", ".")) : parseFloat(raw);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = body.file_url;
    if (!fileUrl) return Response.json({ error: "file_url required" }, { status: 400 });

    // 1. Find or create Plantagen seller
    let sellers = await base44.asServiceRole.entities.Seller.filter({ seller_name: SELLER_NAME });
    let seller;
    if (sellers.length > 0) {
      seller = sellers[0];
    } else {
      seller = await base44.asServiceRole.entities.Seller.create({
        seller_name: SELLER_NAME,
        website_url: SELLER_URL,
        country: "Sweden",
        verified_status: true,
        affiliate_program: false,
      });
    }

    // 2. Replace existing Plantagen products (clean catalog import)
    let deleted = 0;
    let hasMore = true;
    while (hasMore) {
      const existing = await base44.asServiceRole.entities.Product.filter({ seller_id: seller.id }, null, 500);
      if (!existing.length) { hasMore = false; break; }
      await base44.asServiceRole.entities.Product.deleteMany({ seller_id: seller.id });
      deleted += existing.length;
      if (existing.length < 500) hasMore = false;
    }

    // 3. Fetch the uploaded JSON catalog
    const res = await fetch(fileUrl);
    if (!res.ok) return Response.json({ error: "Failed to fetch file", status: res.status }, { status: 502 });
    const raw = await res.json();
    const rows = Array.isArray(raw) ? raw : (raw.products || raw.data || []);
    if (!Array.isArray(rows)) return Response.json({ error: "Expected a JSON array of products" }, { status: 400 });

    // 4. Transform rows
    const now = new Date().toISOString();
    const records = [];
    const skipped = { noTitle: 0, noPrice: 0 };

    for (const row of rows) {
      const title = cleanTitle(row["Produktnamn"]);
      const price = parsePrice(row["Pris (SEK)"]);
      if (!title) { skipped.noTitle++; continue; }
      if (price === null || price <= 0) { skipped.noPrice++; continue; }

      const descParts = [
        row["Produktbeskrivning"],
        row["Användningsområde"] ? `Användningsområde: ${row["Användningsområde"]}` : null,
        row["Viktigaste råd"] ? `Viktigaste råd: ${row["Viktigaste råd"]}` : null,
      ].filter(Boolean);
      const description = descParts.join("\n").slice(0, 1000) || undefined;

      records.push({
        product_title: title,
        price,
        currency: "SEK",
        seller_id: seller.id,
        image_url: row["Produktbild"] || undefined,
        article_number: row["Artikelnummer"] ? String(row["Artikelnummer"]) : undefined,
        category: row["Kategori"] || "Övrigt",
        description,
        availability: "in_stock",
        shipping_cost: 0,
        total_price: price,
        last_checked: now,
      });
    }

    // 5. Bulk create in batches of 500
    let created = 0;
    const BATCH = 500;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const result = await base44.asServiceRole.entities.Product.bulkCreate(batch);
      created += Array.isArray(result) ? result.length : (result?.created ?? batch.length);
    }

    return Response.json({
      seller_id: seller.id,
      rows_received: rows.length,
      deleted_existing: deleted,
      imported: created,
      skipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}