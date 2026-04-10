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
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { language } = await req.json().catch(() => ({}));

    // Fetch premade voices from ElevenLabs account
    // These are the highest quality voices — multilingual, 29 languages via eleven_multilingual_v2
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': elevenlabsApiKey },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const voices = (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: `★ ${v.name}`,
      category: v.category || 'premade',
      gender: v.labels?.gender || 'unknown',
      accent: v.labels?.accent || 'neutral',
      description: v.labels?.description || v.labels?.['use case'] || '',
      preview_url: v.preview_url || null,
      languages: ['multilingual'],
      source: 'own',
    }));

    // Filter by gender if needed (client can filter)
    // Sort: premade first, then cloned, then generated
    const sorted = voices.sort((a: any, b: any) => {
      const order: Record<string, number> = { premade: 0, cloned: 1, generated: 2 };
      return (order[a.category] ?? 3) - (order[b.category] ?? 3);
    });

    return new Response(JSON.stringify({ voices: sorted }), {
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
