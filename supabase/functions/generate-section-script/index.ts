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

    const {
      country,
      city,
      place,
      section,
      previous_ending,
      previous_opening,
      previous_openings_list,
      next_title,
      language,
      mode,
      covered_valleys,
      flight_theme,
      estimated_listening_minutes,
      include_intro_outro_notes,
    } = await req.json();

    if (!place || !section) {
      throw new Error('Place and section are required');
    }

    const isBalloonMode = mode === 'balloon';
    const estimatedMinutes = Math.max(isBalloonMode ? 10 : 3, Number(section.estimated_minutes || estimated_listening_minutes || 3));
    const wordCount = estimatedMinutes * (isBalloonMode ? 145 : 150);
    const lang = language || 'English';
    const valleys = Array.isArray(covered_valleys) ? covered_valleys.filter(Boolean) : [];

    const standardSystemPrompt = `You are a LOCAL RESIDENT of ${city}, ${country} who works as a professional audio tour guide. You have lived here your entire life. You grew up in these streets, your grandparents told you stories about these landmarks, and you have spent years studying the history of your hometown out of genuine love and pride.

IDENTITY AND VOICE:
- Speak as someone who LIVES here and knows every corner intimately
- Use the names locals use for places, not just official tourist names
- Reference local customs, festivals, food, and daily life that visitors would miss
- Share stories only a resident would know
- Express genuine pride and emotion when describing your city's heritage
- Include practical local tips
- Your humor should reflect ${country}'s cultural style
- Write in ${lang} with natural speech patterns authentic to a ${lang}-speaking guide from ${country}
- The listener should feel they have a knowledgeable LOCAL FRIEND guiding them

Your narration style:
- HOOK: Start with something immediately captivating. NEVER start with generic openings.
- Every section MUST open with a completely unique first sentence.
- STORYTELLING: Weave facts into compelling narratives.
- HUMOR: Every section should include at least one charming or surprising moment.
- SENSORY: Paint vivid pictures with words.
- FACTS: Include specific dates, measurements, architect or artist names, and verifiable historical details.
- LOCAL COLOR: Share local legends, traditions, superstitions, or customs.
- PRACTICAL: Every section must include at least one practical tip.
- TRANSITIONS: End with a smooth, natural lead-in.
- PHYSICAL GUIDANCE: Naturally guide the visitor's attention to what they can see right now.

Critical rules:
- Write in ${lang}
- Target exactly ${wordCount} words
- Write for spoken delivery
- No markdown, no headers, no bullet points, no asterisks, no em-dashes, no en-dashes
- NEVER use quotation marks in the script
- NEVER use abbreviations like AD, BC, St., Mt.
- Structure the script in clear short paragraphs of 2-3 sentences each
- Every historical fact must be accurate and verifiable for ${place} in ${city}, ${country}`;

    const balloonSystemPrompt = `You are an elite travel narrator crafting a premium hot air balloon audio guide about ${place} in ${city}, ${country}.

VOICE AND APPROACH:
- Sound refined, calm, trustworthy, and deeply informed
- Write in ${lang} with elegant spoken rhythm suitable for premium travel audio
- The narration must feel timeless and evergreen, not tied to any exact flight path or moment
- The listener may start this audio at any point during a flight, so the story must still make sense

ABSOLUTE BALLOON RULES:
- DO NOT use directional language: left, right, below, above, ahead, behind, beneath, overhead, in front of you, to your side
- DO NOT claim live flight conditions: altitude, wind, route, drift, now flying, currently, at this moment, we are passing, we are rising
- DO NOT use walking-tour guidance: next stop, step closer, turn around, move on
- DO NOT imply exact real-time positioning or a guaranteed view
- DO NOT fabricate facts or overstate certainty

CONTENT PRIORITIES:
- General information first, rooted in verifiable history and geography
- Explain volcanic origins, tuff rock, erosion, fairy chimney formation, rock-cut life, monastic history, pigeon houses, agriculture, and the distinct identity of each selected valley where relevant
- Include hidden gems, lesser-known context, local traditions, and premium storytelling detail
- Keep the piece rich and layered, but never misleading
- If multiple valleys are provided, each one must receive clear and distinct coverage
- If ${include_intro_outro_notes ? 'intro and closing notes are requested' : 'intro and closing notes are not requested'}, adapt the flow accordingly

DELIVERY RULES:
- Target approximately ${wordCount} words
- Use short spoken paragraphs separated by blank lines
- No markdown, no headers, no bullet points, no quotation marks, no em-dashes, no en-dashes
- Write for TTS, with natural variation in rhythm and sentence length
- Keep it immersive through ideas, not live directions`;

    const standardUserPrompt = `Write the narration script for ${section.title} of the ${place} audio tour in ${city}, ${country}.

Section details:
- Subtitle: ${section.subtitle || ''}
- Key topics to cover: ${(section.key_topics || []).join(', ')}
- Mood or tone: ${section.mood || 'engaging'}
- Fun fact to include: ${section.fun_fact || ''}
${previous_ending ? `
CONTINUITY - The previous section ended with:
${previous_ending}
${previous_opening ? `
The previous section started with: ${previous_opening}
You MUST use a completely different opening technique.` : ''}${previous_openings_list ? `

All previous openings:
${previous_openings_list}

Your opening must be completely different from all of the above.` : ''}

This section should feel connected to the previous one but start with a fresh, unique opening.` : '\nThis is the opening section of the tour. Start with a dramatic, captivating hook.'}
${next_title ? `
The next section is: ${next_title}
End by naturally leading the visitor toward the next stop.` : '\nThis is the final section of the tour. End with a memorable reflection, recommend the best photo spots, mention what to see nearby, and thank the listener for joining the tour.'}

Write a compelling, factually accurate narration in ${lang}, pure narration text only.`;

    const balloonUserPrompt = `Write the complete long-form narration script for ${section.title} of the balloon experience guide for ${place} in ${city}, ${country}.

Guide details:
- Subtitle: ${section.subtitle || ''}
- Key topics to cover: ${(section.key_topics || []).join(', ')}
- Theme: ${flight_theme || 'Balanced overview'}
- Covered valleys: ${valleys.length ? valleys.join(', ') : 'Not specified'}
- Mood: ${section.mood || 'awe-inspiring'}
- Fun fact to include: ${section.fun_fact || ''}
- Target length: about ${estimatedMinutes} minutes

Narrative structure requirements:
- Open with a strong, elegant hook about why this landscape is globally extraordinary
- Move into geology and landscape formation
- Cover each selected valley with a clearly distinct identity
- Explain how people lived with this landscape across centuries
- Add lesser-known historical or cultural detail that premium guests would value
- Close with a reflective, memorable ending about the broader Cappadocia experience

Critical writing rules:
- No directional cues
- No live flight claims
- No real-time route narration
- No walking-tour language
- No false immediacy
- Every paragraph must still be accurate if the balloon route changes completely

Write pure narration text only in ${lang}.`;

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
            content: isBalloonMode ? balloonSystemPrompt : standardSystemPrompt,
          },
          {
            role: 'user',
            content: isBalloonMode ? balloonUserPrompt : standardUserPrompt,
          },
        ],
        max_tokens: isBalloonMode ? 4200 : 2500,
        temperature: isBalloonMode ? 0.55 : 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate section script');
    }

    const data = await response.json();
    const script = data.choices[0].message.content.trim()
      .replace(/["“”]/g, '')
      .replace(/[‘’]/g, "'")
      .replace(/[—]/g, ', ')
      .replace(/[–]/g, ', ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n');

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
