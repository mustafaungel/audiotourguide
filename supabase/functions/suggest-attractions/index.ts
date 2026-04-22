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

    const { country, city, mode } = await req.json();
    if (!country || !city) {
      throw new Error('Country and city are required');
    }

    const isBalloonMode = mode === 'balloon';

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
            content: 'You are a tourism expert with deep, verified knowledge of attractions worldwide. Return ONLY a valid JSON array, no other text. All information must be factually accurate.',
          },
          {
            role: 'user',
            content: isBalloonMode
              ? `List the most relevant attractions, scenic zones, valleys, viewpoints, cultural sites, experiences, and hidden gems connected to ${city}, ${country} for creating a premium balloon or aerial-style audio guide. Be exhaustive and aim for 30-50 results.

Group the results conceptually using one of these values for group:
- Major Highlights
- Valleys and Scenic Areas
- Historical Sites
- Local Experiences
- Hidden Gems

For each result provide:
- name: official English name
- type: one of [museum, historical_site, valley, natural_wonder, castle, palace, temple, mosque, church, cathedral, monument, park, market, district, bridge, tower, archaeological_site, cave, waterfall, beach, island, garden, theater, gallery, fortress, ruins, viewpoint, square, experience, adventure]
- description: one-line description, max 100 chars
- suggested_category: one of [Cultural Heritage, Natural Wonder, Historical, Art & Culture, Architecture, Religious, Modern Attraction, Local Experience]
- significance: why it matters, max 150 chars
- group: one of the group values above

Critical requirements:
- Include all major valleys separately when relevant
- Include scenic areas, viewpoints, rock formations, open-air museums, underground cities, districts, and cultural experiences
- Include hidden gems that a premium guide creator should not miss
- Return ONLY a valid JSON array`
              : `List ALL major tourist attractions in ${city}, ${country}. Be exhaustive and include every notable place a tourist might visit. Aim for 30-50 results.

Group the results conceptually using one of these values for group:
- Major Highlights
- Historical Sites
- Scenic Areas
- Local Experiences
- Hidden Gems

For each provide:
- name: official name in English
- type: one of [museum, historical_site, valley, natural_wonder, castle, palace, temple, mosque, church, cathedral, monument, park, market, district, bridge, tower, archaeological_site, cave, waterfall, beach, island, garden, theater, gallery, fortress, ruins, viewpoint, square, experience, adventure]
- description: one-line description, max 100 chars
- suggested_category: one of [Cultural Heritage, Natural Wonder, Historical, Art & Culture, Architecture, Religious, Modern Attraction, Local Experience]
- significance: why this place is important, max 150 chars
- group: one of the group values above

Return ONLY a valid JSON array.`,
          },
        ],
        max_tokens: 6000,
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
