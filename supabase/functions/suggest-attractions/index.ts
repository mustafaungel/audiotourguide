import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { country, city } = await req.json();
    if (!country || !city) {
      throw new Error('Country and city are required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a tourism expert with deep, verified knowledge of tourist attractions worldwide. Return ONLY a valid JSON array, no other text. All information must be factually accurate.`
          },
          {
            role: 'user',
            content: `List the top 25 tourist attractions, landmarks, museums, historical sites, natural wonders, valleys, and cultural locations in ${city}, ${country} that international tourists visit.

For each attraction provide:
- "name": Official name in English
- "type": One of [museum, historical_site, valley, natural_wonder, castle, palace, temple, mosque, church, cathedral, monument, park, market, district, bridge, tower, archaeological_site, cave, waterfall, beach, island, garden, theater, gallery, fortress, ruins, viewpoint, square]
- "description": One-line description (max 100 chars)
- "suggested_category": One of [Cultural Heritage, Natural Wonder, Historical, Art & Culture, Architecture, Religious, Modern Attraction, Local Experience]
- "significance": Why this place is important for visitors (max 150 chars)

Return ONLY a valid JSON array. Include both world-famous landmarks AND hidden gems. Ensure all names and facts are accurate.

Example format:
[{"name": "Goreme Open Air Museum", "type": "museum", "description": "UNESCO cave churches with stunning Byzantine frescoes", "suggested_category": "Cultural Heritage", "significance": "Best preserved example of rock-carved Byzantine art in the world"}]`
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate attraction suggestions');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    let attractions;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      attractions = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse attraction suggestions');
    }

    return new Response(JSON.stringify({ attractions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
