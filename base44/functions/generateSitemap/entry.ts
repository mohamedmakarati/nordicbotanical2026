import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URL = "https://nordicbotanical.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/search", priority: "0.9", changefreq: "daily" },
  { path: "/sellers", priority: "0.7", changefreq: "weekly" },
  { path: "/plants", priority: "0.9", changefreq: "daily" },
  { path: "/plants/houseplants", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/succulents", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/cactus", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/perennials", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/herbs", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/trees", priority: "0.7", changefreq: "weekly" },
  { path: "/plants/shrubs", priority: "0.7", changefreq: "weekly" },
  { path: "/plants/seeds", priority: "0.7", changefreq: "weekly" },
  { path: "/plants/roses", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/lavender", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/hydrangea", priority: "0.8", changefreq: "weekly" },
  { path: "/plants/orchid", priority: "0.8", changefreq: "weekly" },
];

const HREFLANG_LOCALES = [
  { lang: "sv", country: "SE" },
  { lang: "no", country: "NO" },
  { lang: "da", country: "DK" },
  { lang: "fi", country: "FI" },
  { lang: "en", country: null },
  { lang: "ar", country: null },
];

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildHreflang(path) {
  return HREFLANG_LOCALES.map(({ lang, country }) => {
    const tag = country ? `${lang}-${country}` : lang;
    const prefix = lang === "sv" ? "" : `/${lang}`;
    return `    <xhtml:link rel="alternate" hreflang="${tag}" href="${BASE_URL}${prefix}${path}"/>`;
  }).join("\n");
}

function urlEntry(path, priority, changefreq, lastmod) {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${buildHreflang(path)}
  </url>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const format = body.format || "sitemap"; // "sitemap" | "robots"

    if (format === "robots") {
      const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /wishlist
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml

User-agent: NordicBotanicalBot
Allow: /
Crawl-delay: 2`;
      return new Response(robots, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Build sitemap
    const plants = await base44.asServiceRole.entities.Plant.list();
    const today = new Date().toISOString().split("T")[0];

    const staticEntries = STATIC_PAGES.map((p) =>
      urlEntry(p.path, p.priority, p.changefreq, today)
    );

    const plantEntries = plants
      .filter((p) => p.scientific_name || p.plant_name)
      .map((p) => {
        const slug = slugify(p.scientific_name || p.plant_name);
        return urlEntry(`/plants/${slug}`, "0.7", "weekly", today);
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticEntries, ...plantEntries].join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});