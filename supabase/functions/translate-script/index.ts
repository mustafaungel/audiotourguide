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

    const { script, source_language, target_language, place, section_title } = await req.json();
    if (!script || !target_language) {
      throw new Error('Script and target_language are required');
    }

    // Strip header/title lines before translating (they shouldn't be in the narration)
    let cleanScript = script;
    const lines = script.split('\n');
    let startIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (!line) { startIdx = i + 1; continue; }
      if (line.length < 80 && /[–—]/.test(line)) { startIdx = i + 1; continue; }
      if (/^(Description|Script|Title|Section|Chapter|Introduction)\s*\*?$/i.test(line)) { startIdx = i + 1; continue; }
      if (line.startsWith('*"') || line.startsWith('Description ')) { startIdx = i + 1; continue; }
      break;
    }
    if (startIdx > 0) cleanScript = lines.slice(startIdx).join('\n').trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in tourism and cultural content with native-level fluency in ${target_language}. You translate audio tour narrations while preserving their soul. The source text is a professionally written audio guide script — the translation must maintain the same professional quality and flow.

TRANSLATION RULES:
- Maintain the narrator's personality, humor, warmth, and storytelling style completely
- Adapt cultural references, idioms, and wordplay to feel natural and clever in ${target_language}
- Keep proper nouns (place names, historical figures) in their commonly used form in ${target_language}
- Preserve the emotional tone, dramatic pacing, and sensory descriptions
- Ensure all historical facts, dates, and measurements remain accurate
- Adapt measurement units if the target audience typically uses different units
- The result must sound like it was ORIGINALLY written in ${target_language} by a native speaker, NOT like a translation
- Keep the translated text within ±15% of the original word count to ensure similar audio duration. If ${target_language} naturally requires more or fewer words, prioritize natural flow over exact count
- Preserve paragraph breaks and natural speech rhythm

CULTURAL AND LINGUISTIC AUTHENTICITY for ${target_language}:
- You are translating for native ${target_language} speakers who will LISTEN to this as an audio guide while visiting the location
- Use the appropriate level of formality standard for audio tour guides in ${target_language}-speaking countries
- For languages with honorifics or formal/informal registers, use the polite form appropriate for a professional guide addressing tourists
- Apply the natural rhythm, sentence structure, and storytelling conventions of ${target_language}
- Local expressions, proverbs, or cultural analogies from ${target_language} culture should replace English-specific references where appropriate
- Preserve the emotional impact: if the original evokes wonder, the translation must evoke equal wonder in ${target_language}
- The listener should FEEL the guide is a native ${target_language} speaker who loves sharing their knowledge of this place

AUDIO/TTS OPTIMIZATION — this text will be read aloud by a text-to-speech system:
- Use short, punchy sentences for dramatic pauses where the original does the same
- Write numbers as words (e.g., "fifteen hundred" not "1500", adapt for ${target_language})
- Avoid ALL abbreviations in every language — write full forms
  * "before the common era" not BCE or BC, "common era" not CE or AD
  * "Saint" not St., "Mount" not Mt.
  * "meters" not m, "kilometers" not km
  * "for example" not e.g., "that is" not i.e.
  * This applies equally in Turkish, French, German, Spanish, etc.
- Use commas for natural breathing pauses
- No quotation marks, em-dashes, or special punctuation that disrupts TTS flow

Do NOT add, remove, or editorialize content. Translate faithfully while adapting naturally for ${target_language} speakers.
Return ONLY the translated narration text. No explanations, no notes, no metadata.`
          },
          {
            role: 'user',
            content: `Translate the following audio tour narration for "${section_title || 'a section'}" at ${place || 'a tourist attraction'} from ${source_language || 'English'} to ${target_language}.

"""
${cleanScript}
"""

Translate this narration to ${target_language}. Return ONLY the translated text, nothing else. No dashes, no markers, no explanations.`
          }
        ],
        max_tokens: 8000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to translate script');
    }

    const data = await response.json();
    // Clean any --- markers or formatting GPT might add
    const raw = data.choices[0].message.content.trim();
    const translated = raw
      .replace(/^---\s*/gm, '').replace(/\s*---$/gm, '')
      .replace(/^"""\s*/gm, '').replace(/\s*"""$/gm, '')
      .replace(/[—]/g, ', ').replace(/[–]/g, ', ')
      .replace(/[""]/g, '').replace(/["]/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return new Response(JSON.stringify({ translated_script: translated, target_language }), {
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
