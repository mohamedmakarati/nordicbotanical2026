import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPageData(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NordicBotanicalBot/1.0; +https://nordicbotanical.com/bot)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { error: `http_${res.status}` };
    const html = await res.text();
    // Extract meaningful text: title, meta, JSON-LD, prices
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "";
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || "";
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || "";
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] || "";

    // JSON-LD structured data
    const jsonLdBlocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let structuredData = null;
    for (const block of jsonLdBlocks) {
      try {
        const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        const data = JSON.parse(inner);
        const product = Array.isArray(data)
          ? data.find((d) => d["@type"] === "Product")
          : data["@type"] === "Product" ? data : null;
        if (product) { structuredData = product; break; }
      } catch { /* skip */ }
    }

    // Extract price patterns from HTML text
    const priceMatches = html.match(/(\d[\d\s]*[,.]?\d*)\s*(?:kr|SEK|:-)/gi) || [];
    const rawPrices = priceMatches.slice(0, 10).map(p => p.trim());

    return {
      title: ogTitle || title,
      description: ogDesc,
      image: ogImage,
      structuredData,
      rawPrices,
      url,
    };
  } catch (err) {
    return { error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { query, seller_urls } = body;

    if (!query) {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    // Load all Swedish sellers from DB
    const sellers = await base44.asServiceRole.entities.Seller.filter({ country: "Sweden" });

    // Also load DB products matching the query
    const allProducts = await base44.asServiceRole.entities.Product.list("-last_checked", 500);
    const q = query.toLowerCase();
    const matchingProducts = allProducts.filter(p =>
      p.product_title?.toLowerCase().includes(q)
    );

    // Enrich with seller info
    const sellerMap = Object.fromEntries(sellers.map(s => [s.id, s]));
    const dbResults = matchingProducts.map(p => {
      const seller = sellerMap[p.seller_id] || {};
      return {
        source: "database",
        product_title: p.product_title,
        price: p.price,
        regular_price: p.regular_price || null,
        currency: p.currency || "SEK",
        availability: p.availability || "in_stock",
        image_url: p.image_url || null,
        product_url: p.product_url,
        seller_name: seller.seller_name || "Okänd butik",
        seller_website: seller.website_url || null,
        last_checked: p.last_checked || p.updated_date,
        shipping_cost: p.shipping_cost || 0,
      };
    });

    // Live-check seller websites if provided
    const liveResults = [];
    const urlsToCheck = seller_urls || [];

    for (const url of urlsToCheck.slice(0, 5)) {
      await sleep(1000);
      const pageData = await fetchPageData(url);
      if (pageData.error) {
        liveResults.push({ source: "live", url, error: pageData.error });
        continue;
      }
      liveResults.push({ source: "live", url, ...pageData });
    }

    // Use AI to analyze live pages and extract structured price data
    let aiAnalysis = null;
    if (liveResults.filter(r => !r.error).length > 0 || dbResults.length > 0) {
      const liveContext = liveResults
        .filter(r => !r.error)
        .map(r => {
          const sd = r.structuredData;
          if (sd) {
            const offer = Array.isArray(sd.offers) ? sd.offers[0] : sd.offers;
            return `URL: ${r.url}\nProdukt: ${sd.name || r.title}\nPris: ${offer?.price} ${offer?.priceCurrency}\nTillgänglighet: ${offer?.availability}`;
          }
          return `URL: ${r.url}\nTitel: ${r.title}\nPriser funna: ${r.rawPrices?.join(", ")}\nBeskrivning: ${r.description?.slice(0, 200)}`;
        }).join("\n---\n");

      const dbContext = dbResults.slice(0, 10).map(r =>
        `Butik: ${r.seller_name} | Produkt: ${r.product_title} | Pris: ${r.price} SEK | Ordinarie: ${r.regular_price || "-"} SEK | URL: ${r.product_url}`
      ).join("\n");

      aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Du är en prisanalys-expert för den svenska växtmarknaden.

Sökfråga: "${query}"

DATABAS-PRODUKTER (redan sparade priser):
${dbContext || "Inga"}

LIVE-SKRAPADE SIDOR:
${liveContext || "Inga"}

Analysera och returnera:
1. En prisjämförelse-sammanfattning på svenska
2. Vilket erbjudande är bäst (lägsta totalpris inkl frakt om känt)
3. Prisvariation (min, max, medel)
4. Rekommendation till köparen

Var konkret med priser i SEK. Om live-sidor saknar tydliga priser, basera analysen på databasen.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            best_deal: { type: "string" },
            price_range: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                avg: { type: "number" },
              },
            },
            recommendation: { type: "string" },
            insights: { type: "array", items: { type: "string" } },
          },
        },
      });
    }

    // Parse live structured data into comparable format
    const parsedLive = liveResults
      .filter(r => !r.error && r.structuredData)
      .map(r => {
        const sd = r.structuredData;
        const offer = Array.isArray(sd.offers) ? sd.offers[0] : sd.offers;
        return {
          source: "live",
          product_title: sd.name || r.title,
          price: offer?.price ? parseFloat(offer.price) : null,
          regular_price: offer?.highPrice ? parseFloat(offer.highPrice) : null,
          currency: offer?.priceCurrency || "SEK",
          availability: offer?.availability?.includes("InStock") ? "in_stock" : "unknown",
          image_url: r.image || null,
          product_url: r.url,
          seller_name: new URL(r.url).hostname.replace("www.", ""),
          last_checked: new Date().toISOString(),
          shipping_cost: 0,
        };
      });

    const allResults = [...dbResults, ...parsedLive].sort((a, b) => (a.price || 999999) - (b.price || 999999));

    return Response.json({
      query,
      total_results: allResults.length,
      db_results: dbResults.length,
      live_results: parsedLive.length,
      results: allResults,
      ai_analysis: aiAnalysis,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});