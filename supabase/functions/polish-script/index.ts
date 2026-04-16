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
    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');

    const { script, language, place } = await req.json();
    if (!script) throw new Error('Script is required');

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
            content: `You are an expert audio tour guide script editor. Your job is to POLISH an existing narration script while preserving its meaning, structure, and personality.

RULES:
- Keep the same content, facts, stories, and structure exactly
- Fix grammar, spelling, and punctuation errors
- Improve sentence flow and readability for spoken narration
- Ensure natural TTS-friendly text:
  * Use short, punchy sentences for dramatic pauses where appropriate
  * Write numbers as words (e.g., "fifteen hundred" not "1500")
  * No abbreviations, write full forms (e.g., "Saint Basil" not "St. Basil")
  * Use commas for natural breathing pauses
  * No em-dashes or en-dashes, use commas instead
  * No quotation marks or special punctuation that disrupts TTS
  * No smart quotes or curly quotes
- Preserve paragraph breaks exactly as they are
- Keep word count within plus or minus 10 percent of original
- Do NOT add new facts, stories, opinions, or information
- Do NOT remove any facts, stories, or key information
- Do NOT change the narrator's voice, humor, warmth, or personality
- Maintain the same level of formality and tone
- If the script mentions specific directions (look up, turn left), keep them exactly
- Return ONLY the polished script text, no explanations, no notes, no markers

Language: ${language || 'English'}
${place ? `Location: ${place}` : ''}`
          },
          {
            role: 'user',
            content: `Polish this audio tour narration script. Fix errors, improve flow, optimize for TTS. Keep the same meaning and structure:\n\n${script}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to polish script');
    }

    const data = await response.json();
    const polished = data.choices[0].message.content.trim()
      .replace(/^---\s*/gm, '').replace(/\s*---$/gm, '')
      .replace(/^"""\s*/gm, '').replace(/\s*"""$/gm, '')
      .replace(/[—]/g, ', ').replace(/[–]/g, ', ')
      .replace(/[""]/g, '').replace(/["]/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return new Response(JSON.stringify({ polished_script: polished }), {
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
