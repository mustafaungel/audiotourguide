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

    // 1. Fetch own/premade voices (multilingual — support 29 languages)
    const ownResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': elevenlabsApiKey },
    });

    let ownVoices: any[] = [];
    if (ownResponse.ok) {
      const ownData = await ownResponse.json();
      ownVoices = (ownData.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: `★ ${v.name}`,
        category: v.category || 'premade',
        gender: v.labels?.gender || 'unknown',
        accent: v.labels?.accent || 'multilingual',
        description: v.labels?.description || v.labels?.['use case'] || '',
        preview_url: v.preview_url || null,
        languages: ['multilingual'],
        source: 'own',
      }));
    }

    // 2. Fetch shared voices that support the selected language
    // This includes: native speakers + anyone who added this language
    let sharedVoices: any[] = [];
    if (language) {
      const sharedParams = new URLSearchParams({
        page_size: '100',
        search: language, // Search by language name — finds native + supporting voices
      });

      const sharedResponse = await fetch(
        `https://api.elevenlabs.io/v1/shared-voices?${sharedParams.toString()}`,
        { headers: { 'xi-api-key': elevenlabsApiKey } }
      );

      if (sharedResponse.ok) {
        const sharedData = await sharedResponse.json();
        sharedVoices = (sharedData.voices || []).map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: 'shared',
          gender: v.gender || 'unknown',
          accent: v.accent || 'unknown',
          description: v.description || '',
          preview_url: v.preview_url || null,
          languages: [v.language || language || 'en'],
          source: 'library',
        }));
      }
    }

    // 3. Merge: when language selected → native/shared first, then premade
    //    when no language → premade only
    const allVoices = language
      ? [...sharedVoices, ...ownVoices]  // Native speakers first
      : [...ownVoices];                  // Default: premade only

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
