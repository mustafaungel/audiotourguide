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

    // Fetch voices with v2 API for verified_languages support
    const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', {
      headers: { 'xi-api-key': elevenlabsApiKey },
    });

    if (!response.ok) {
      // Fallback to v1 if v2 fails
      const v1Response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': elevenlabsApiKey },
      });
      if (!v1Response.ok) throw new Error(`ElevenLabs API error: ${v1Response.status}`);
      const v1Data = await v1Response.json();
      const v1Voices = (v1Data.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category || 'premade',
        gender: v.labels?.gender || 'unknown',
        accent: v.labels?.accent || 'unknown',
        description: v.labels?.description || v.labels?.['use case'] || '',
        preview_url: v.preview_url || null,
        languages: ['en'],
      }));
      return new Response(JSON.stringify({ voices: v1Voices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const voices = data.voices || [];

    const mappedVoices = voices.map((v: any) => {
      // Extract verified language codes
      const verifiedLangs = (v.verified_languages || []).map((l: any) => l.language_id || l.code || '');
      const labelLang = v.labels?.language || 'en';
      // Combine: verified languages + label language (deduplicated)
      const allLangs = [...new Set([...verifiedLangs, labelLang].filter(Boolean))];

      return {
        voice_id: v.voice_id,
        name: v.name,
        category: v.category || 'premade',
        gender: v.labels?.gender || 'unknown',
        accent: v.labels?.accent || 'unknown',
        description: v.labels?.description || v.labels?.['use case'] || '',
        preview_url: v.preview_url || null,
        languages: allLangs.length > 0 ? allLangs : ['en'],
      };
    });

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
