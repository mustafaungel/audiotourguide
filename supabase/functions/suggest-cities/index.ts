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

    const { country, mode } = await req.json();
    if (!country) {
      throw new Error('Country is required');
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
            content: 'You are a travel expert with encyclopedic knowledge of global tourism. Return ONLY a valid JSON array, no other text.',
          },
          {
            role: 'user',
            content: isBalloonMode
              ? `List the top 40 tourist cities, destination regions, and travel hubs in ${country} that are useful for creating premium sightseeing or balloon-style audio guides.

For each result provide:
- name: destination name in English
- description: one-line explanation, max 90 chars
- kind: one of city, region, destination_hub

Requirements:
- Include famous cities AND destination regions such as Cappadocia-style areas when relevant
- Include UNESCO zones, scenic regions, and tourism hubs
- Sort by international tourism relevance
- Return ONLY a valid JSON array`
              : `List the top 30 cities and tourist destinations in ${country} that are popular with international tourists and have notable attractions worth creating audio guides for.

For each city provide:
- name: city or destination name in English
- description: one-line description, max 80 chars
- kind: one of city, region, destination_hub

Return ONLY a valid JSON array sorted by popularity.`,
          },
        ],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate city suggestions');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    let cities;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cities = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse city suggestions');
    }

    return new Response(JSON.stringify({ cities }), {
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
