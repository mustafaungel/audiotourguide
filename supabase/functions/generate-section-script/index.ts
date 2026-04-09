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

    const { country, city, place, section, previous_ending, next_title, language } = await req.json();
    if (!place || !section) {
      throw new Error('Place and section are required');
    }

    const estimatedMinutes = Math.max(3, section.estimated_minutes || 3); // Minimum 3 minutes
    const wordCount = estimatedMinutes * 150; // ~150 words per minute of speech
    const lang = language || 'English';

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
            content: `You are an award-winning audio tour guide narrator known for bringing locations to life with expertise, warmth, and wit. You have been praised by travelers worldwide for making history feel alive and personal.

Your narration style:
- HOOK: Start with something immediately captivating — a dramatic fact, a vivid image, or a thought-provoking question. NEVER start with "Welcome to..." or "Let me tell you about..." or any generic opening.
- STORYTELLING: Weave facts into compelling narratives. You are telling a STORY, not giving a lecture. Every fact should serve the narrative.
- HUMOR: Include 1-2 clever observations or witty remarks that feel natural and intelligent. The humor should make the listener smile, never cringe. Think of it as the kind of comment a well-read, charming friend would make.
- SENSORY: Paint vivid pictures with words — describe the golden light hitting ancient stones, the echo of footsteps in vaulted halls, the scent of cypress trees, the rough texture of centuries-old walls.
- FACTS: Include specific dates, measurements, architect/artist names, and verifiable historical details. NEVER fabricate or guess facts. If a date is approximate, say "around" or "approximately."
- LOCAL COLOR: Share local legends, traditions, superstitions, or customs. What do locals say about this place? What stories do grandparents tell their grandchildren here?
- PRACTICAL: Naturally weave in useful tips — best photo angles, what details to look for, where to stand for the best acoustics or view.
- TRANSITIONS: End with a smooth, natural lead-in that makes the listener eager to continue to the next section.
- PACING: Use varied sentence lengths. Short punchy facts create drama. Then longer, flowing descriptions let the atmosphere sink in. This rhythm keeps listeners engaged.

Critical rules:
- Write in ${lang}
- Target exactly ${wordCount} words (approximately ${estimatedMinutes} minutes when spoken at natural pace)
- Write for SPOKEN delivery — this will be read aloud by a professional voice
- Use contractions and natural speech patterns appropriate for ${lang}
- No markdown, no headers, no bullet points, no asterisks — pure narration text only
- Every historical fact must be accurate and verifiable for ${place} in ${city}, ${country}`
          },
          {
            role: 'user',
            content: `Write the narration script for "${section.title}" of the ${place} audio tour in ${city}, ${country}.

Section details:
- Subtitle: ${section.subtitle || ''}
- Key topics to cover: ${(section.key_topics || []).join(', ')}
- Mood/tone: ${section.mood || 'engaging'}
- Fun fact to include: ${section.fun_fact || ''}
${previous_ending ? `\nCONTINUITY - The previous section ended with:\n"${previous_ending}"\n\nCRITICAL: This section MUST feel like a natural continuation of the tour. Reference what was just discussed, use a connecting phrase, and build upon the narrative thread. Do NOT start as if this is a new, disconnected story. The listener just heard the previous section — continue the journey seamlessly.` : '\nThis is the OPENING section of the tour. Set the scene, create excitement, and give the visitor a reason to listen to every section.'}
${next_title ? `\nThe next section is: "${next_title}"\nEnd by naturally leading the visitor toward the next stop. Create anticipation without being forced.` : '\nThis is the FINAL section of the tour. End with a memorable reflection, recommend the best photo spots, mention what to see nearby, and thank the listener for joining the tour.'}

Write a compelling, factually accurate narration that makes the visitor feel the magic and significance of this place. Remember: approximately ${wordCount} words, in ${lang}, pure narration text only.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate section script');
    }

    const data = await response.json();
    const script = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ script, section_title: section.title, language: lang }), {
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
