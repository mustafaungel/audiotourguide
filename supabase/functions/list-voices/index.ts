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

    // 1. Fetch own/premade voices
    const ownResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': elevenlabsApiKey },
    });

    let ownVoices: any[] = [];
    if (ownResponse.ok) {
      const ownData = await ownResponse.json();
      ownVoices = (ownData.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category || 'premade',
        gender: v.labels?.gender || 'unknown',
        accent: 'multilingual',
        description: v.labels?.description || v.labels?.['use case'] || '',
        preview_url: v.preview_url || null,
        languages: ['multilingual'],
        source: 'own',
        usage_count: 999999,
      }));
    }

    // 2. Fetch shared voices with language filter and trending sort
    let sharedVoices: any[] = [];
    const sharedParams = new URLSearchParams({
      page_size: '50',
      sort: 'trending',
    });
    if (language) {
      sharedParams.set('language', language);
    }

    const sharedResponse = await fetch(
      `https://api.elevenlabs.io/v1/shared-voices?${sharedParams.toString()}`,
      { headers: { 'xi-api-key': elevenlabsApiKey } }
    );

    if (sharedResponse.ok) {
      const sharedData = await sharedResponse.json();
      const rawVoices = sharedData.voices || [];

      // Quality filter: only voices with significant usage
      sharedVoices = rawVoices
        .filter((v: any) =>
          (v.usage_character_count || 0) >= 1000 ||
          (v.cloned_by_count || 0) >= 50
        )
        .map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: 'shared',
          gender: v.gender || 'unknown',
          accent: v.accent || 'unknown',
          description: v.description || '',
          preview_url: v.preview_url || null,
          languages: [v.language || language || 'en'],
          source: 'library',
          usage_count: v.usage_character_count || 0,
        }));
    }

    // 3. Merge: premade (starred) always first, then quality shared voices
    const allVoices = [
      ...ownVoices.map(v => ({ ...v, name: `★ ${v.name}` })),
      ...sharedVoices,
    ];

    // Deduplicate by voice_id
    const seen = new Set();
    const unique = allVoices.filter(v => {
      if (seen.has(v.voice_id)) return false;
      seen.add(v.voice_id);
      return true;
    });

    return new Response(JSON.stringify({ voices: unique }), {
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
