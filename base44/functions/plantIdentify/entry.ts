import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("PLANT_ID_API_KEY");
    if (!apiKey) return Response.json({ error: 'PLANT_ID_API_KEY not set' }, { status: 500 });

    const { image_base64, image_url } = await req.json();

    const images = image_base64 ? [image_base64] : image_url ? [image_url] : null;
    if (!images) return Response.json({ error: 'image_base64 or image_url required' }, { status: 400 });

    const res = await fetch('https://plant.id/api/v3/identification?details=common_names,url,description,best_watering,best_light_condition,toxicity&language=sv', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        similar_images: true,
        health: 'all',
      }),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return Response.json({ error: 'Plant.id returned non-JSON response', raw: rawText.slice(0, 500) }, { status: 502 });
    }

    if (!res.ok) {
      return Response.json({ error: data.message || 'Plant.id API error', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});