import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANG_NAME_TO_CODE: Record<string, string> = {
  'English': 'en', 'Turkish': 'tr', 'Russian': 'ru',
  'German': 'de', 'French': 'fr', 'Spanish': 'es',
  'Italian': 'it', 'Portuguese': 'pt', 'Arabic': 'ar',
  'Chinese': 'zh', 'Japanese': 'ja', 'Korean': 'ko',
  'Hindi': 'hi', 'Dutch': 'nl', 'Polish': 'pl',
  'Greek': 'el', 'Czech': 'cs', 'Romanian': 'ro',
  'Swedish': 'sv', 'Norwegian': 'no', 'Danish': 'da',
  'Finnish': 'fi', 'Hungarian': 'hu', 'Ukrainian': 'uk',
  'Indonesian': 'id', 'Malay': 'ms', 'Thai': 'th',
  'Vietnamese': 'vi', 'Filipino': 'fil', 'Bulgarian': 'bg',
  'Croatian': 'hr', 'Slovak': 'sk', 'Slovenian': 'sl',
  'Serbian': 'sr', 'Hebrew': 'he', 'Persian': 'fa',
  'Tamil': 'ta', 'Telugu': 'te', 'Bengali': 'bn',
  'Urdu': 'ur', 'Swahili': 'sw', 'Catalan': 'ca',
  'Galician': 'gl', 'Basque': 'eu', 'Welsh': 'cy',
  'Irish': 'ga', 'Afrikaans': 'af', 'Albanian': 'sq',
  'Azerbaijani': 'az', 'Georgian': 'ka', 'Kazakh': 'kk',
  'Latvian': 'lv', 'Lithuanian': 'lt', 'Macedonian': 'mk',
  'Mongolian': 'mn', 'Nepali': 'ne',
};

function resolveLanguageCode(language: string): string {
  if (!language) return '';
  // Already an ISO code (2-3 chars)
  if (language.length <= 3 && language === language.toLowerCase()) return language;
  // Look up mapping
  return LANG_NAME_TO_CODE[language] || language.toLowerCase().slice(0, 2);
}

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
    const langCode = resolveLanguageCode(language || '');

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
        tier: 'own',
      }));
    }

    // 2. Fetch professional shared voices for the language
    let professionalVoices: any[] = [];
    if (langCode) {
      const profParams = new URLSearchParams({
        page_size: '50',
        language: langCode,
        category: 'professional',
      });

      const profResponse = await fetch(
        `https://api.elevenlabs.io/v1/shared-voices?${profParams.toString()}`,
        { headers: { 'xi-api-key': elevenlabsApiKey } }
      );

      if (profResponse.ok) {
        const profData = await profResponse.json();
        professionalVoices = (profData.voices || []).map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: 'professional',
          gender: v.gender || 'unknown',
          accent: v.accent || 'unknown',
          description: v.description || '',
          preview_url: v.preview_url || null,
          languages: [v.language || langCode],
          source: 'library',
          tier: 'professional',
        }));
      }
    }

    // 3. Fetch trending shared voices for the language
    let trendingVoices: any[] = [];
    if (langCode) {
      const trendParams = new URLSearchParams({
        page_size: '50',
        language: langCode,
        sort: 'trending',
      });

      const trendResponse = await fetch(
        `https://api.elevenlabs.io/v1/shared-voices?${trendParams.toString()}`,
        { headers: { 'xi-api-key': elevenlabsApiKey } }
      );

      if (trendResponse.ok) {
        const trendData = await trendResponse.json();
        trendingVoices = (trendData.voices || []).map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: 'shared',
          gender: v.gender || 'unknown',
          accent: v.accent || 'unknown',
          description: v.description || '',
          preview_url: v.preview_url || null,
          languages: [v.language || langCode],
          source: 'library',
          tier: 'trending',
        }));
      }
    }

    // 4. Merge: ★ Own → Professional → Trending (deduplicated)
    const allVoices = [
      ...ownVoices.map(v => ({ ...v, name: `★ ${v.name}` })),
      ...professionalVoices,
      ...trendingVoices,
    ];

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
