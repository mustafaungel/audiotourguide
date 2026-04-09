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

    // Fetch all available voices from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const voices = data.voices || [];

    // Map and categorize voices
    const mappedVoices = voices.map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category || 'premade',
      labels: v.labels || {},
      gender: v.labels?.gender || 'unknown',
      age: v.labels?.age || 'unknown',
      accent: v.labels?.accent || 'unknown',
      description: v.labels?.description || v.labels?.['use case'] || '',
      preview_url: v.preview_url || null,
    }));

    // Sort: premade first, then by name
    const sorted = mappedVoices.sort((a: any, b: any) => {
      if (a.category === 'premade' && b.category !== 'premade') return -1;
      if (a.category !== 'premade' && b.category === 'premade') return 1;
      return a.name.localeCompare(b.name);
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
