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
            content: `You are a professional translator specializing in tourism and cultural content with native-level fluency in ${target_language}. You translate audio tour narrations while preserving their soul.

Critical translation rules:
- Maintain the narrator's personality, humor, warmth, and storytelling style completely
- Adapt cultural references, idioms, and wordplay to feel natural and clever in ${target_language}
- Keep proper nouns (place names, historical figures) in their commonly used form in ${target_language}
- Preserve the emotional tone, dramatic pacing, and sensory descriptions
- Ensure all historical facts, dates, and measurements remain accurate
- Adapt measurement units if the target audience typically uses different units
- The result must sound like it was ORIGINALLY written in ${target_language} by a native speaker, NOT like a translation
- Match the word count approximately to maintain the same narration duration
- Preserve paragraph breaks and natural speech rhythm

Do NOT add, remove, or editorialize content. Translate faithfully while adapting naturally for ${target_language} speakers.
Return ONLY the translated narration text. No explanations, no notes, no metadata.`
          },
          {
            role: 'user',
            content: `Translate the following audio tour narration for "${section_title || 'a section'}" at ${place || 'a tourist attraction'} from ${source_language || 'English'} to ${target_language}.

---
${script}
---

Translate this narration to ${target_language}. Return ONLY the translated text.`
          }
        ],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to translate script');
    }

    const data = await response.json();
    const translated = data.choices[0].message.content.trim();

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
