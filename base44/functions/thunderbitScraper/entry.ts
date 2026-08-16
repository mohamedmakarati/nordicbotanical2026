import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const THUNDERBIT_BASE_URL = 'https://openapi.thunderbit.com/openapi/v1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = Deno.env.get('THUNDERBIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'THUNDERBIT_API_KEY not configured' }, { status: 500 });

    const { action, url, urls, schema, prompt, renderMode = 'basic', countryCode = 'SE' } = await req.json();

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // POST /distill - convert URL to clean markdown
    if (action === 'distill') {
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });
      const res = await fetch(`${THUNDERBIT_BASE_URL}/distill`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, renderMode, countryCode }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    // POST /extract - extract structured JSON from a URL
    if (action === 'extract') {
      if (!url || !schema) return Response.json({ error: 'url and schema required' }, { status: 400 });
      const res = await fetch(`${THUNDERBIT_BASE_URL}/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, schema, renderMode, countryCode }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    // POST /extract for a list/category page — wraps items in a products array
    if (action === 'extract_list') {
      if (!url || !schema) return Response.json({ error: 'url and schema required' }, { status: 400 });
      const listSchema = {
        type: "object",
        properties: {
          products: {
            type: "array",
            description: "List of all products found on the page",
            items: schema
          }
        },
        required: ["products"]
      };
      const res = await fetch(`${THUNDERBIT_BASE_URL}/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, schema: listSchema, renderMode, countryCode }),
      });
      const data = await res.json();
      // Unwrap: return the products array directly as data
      const products = data?.data?.products ?? data?.products ?? [];
      return Response.json({ data: products }, { status: res.status });
    }

    // Hybrid: distill page → then use LLM to extract product list from markdown
    if (action === 'extract_list_llm') {
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });

      // Step 1: distill page to markdown
      const distillRes = await fetch(`${THUNDERBIT_BASE_URL}/distill`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, renderMode: renderMode || 'full', countryCode }),
      });
      const distillData = await distillRes.json();
      const markdown = distillData?.markdown || distillData?.data?.markdown || '';
      if (!markdown) return Response.json({ error: 'Could not distill page', detail: distillData }, { status: 422 });

      // Step 2: use Base44 LLM to extract products from markdown
      const products = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract all plant products from the following webpage markdown. Return a JSON array of product objects with these fields: product_name (string), scientific_name (string, latin name if shown), price (number in SEK), regular_price (number, only if discounted), product_url (string, full URL), image_url (string), availability ("in_stock", "out_of_stock", or "limited"), currency (default "SEK"). Only include real products. Do not include navigation items or categories.\n\nMarkdown:\n${markdown.slice(0, 12000)}`,
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
      return Response.json({ data: products?.products ?? [] });
    }

    // POST /suggest-fields - suggest schema fields for a URL
    if (action === 'suggest_fields') {
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });
      const res = await fetch(`${THUNDERBIT_BASE_URL}/suggest-fields`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, prompt, renderMode, countryCode }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    // POST /batch/distill - batch distill up to 100 URLs
    if (action === 'batch_distill') {
      if (!urls || !Array.isArray(urls)) return Response.json({ error: 'urls array required' }, { status: 400 });
      const res = await fetch(`${THUNDERBIT_BASE_URL}/batch/distill`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ urls, renderMode, countryCode }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    // POST /batch/extract - batch extract structured JSON from up to 100 URLs
    if (action === 'batch_extract') {
      if (!urls || !Array.isArray(urls) || !schema) return Response.json({ error: 'urls array and schema required' }, { status: 400 });
      const res = await fetch(`${THUNDERBIT_BASE_URL}/batch/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ urls, schema, renderMode, countryCode }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    return Response.json({ error: 'Unknown action. Use: distill, extract, suggest_fields, batch_distill, batch_extract' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});