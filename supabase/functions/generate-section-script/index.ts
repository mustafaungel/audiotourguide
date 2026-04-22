import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildFlightContext } from "../_shared/flight-areas.ts";

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
    const estimatedMinutes = Math.max(2, Number(section.estimated_minutes || estimated_listening_minutes || 3));
    const wordCount = estimatedMinutes * (isBalloonMode ? 145 : 150);
    const lang = language || 'English';
    const valleys = Array.isArray(covered_valleys) ? covered_valleys.filter(Boolean) : [];

    // Inject rich flight area knowledge base for balloon mode
    const flightContext = isBalloonMode ? buildFlightContext(valleys) : '';
    const balloonViolationPattern = /\b(left|right|below|above|ahead|behind|currently|current altitude|now flying|step closer|turn around|next stop|float gently|float over|as you float|as you drift|suspended between earth and sky|at this moment|take in the vistas|we are|you are part of)\b/i;

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

NO-ABBREVIATIONS RULE (applies to ALL languages — critical for TTS):
- Write "before the common era" instead of BCE or BC
- Write "common era" instead of CE or AD
- Write "Saint" instead of St., "Mount" instead of Mt.
- Write "meters", "kilometers", "years" instead of m, km, yrs
- Write "for example" instead of e.g., "that is" instead of i.e.
- Use "and" instead of &, "percent" instead of %, "degrees" instead of °
- Spell out ALL initialisms — never use shortcuts in ANY language
- If an organization has a standard spoken form (like UNESCO), it's acceptable — but write it as the word, not as initials

- Structure the script in clear short paragraphs of 2-3 sentences each
- Every historical fact must be accurate and verifiable for ${place} in ${city}, ${country}`;

    const balloonSystemPrompt = `You are an elite travel narrator and historian crafting a PREMIUM hot air balloon audio guide about ${place} in ${city}, ${country}. Your writing must sound like it belongs to a world-class documentary or a top-tier travel publication. Tourists paid for a UNIQUE, DEEP, UNFORGETTABLE experience — generic or shallow content is unacceptable.

${flightContext}

VOICE AND APPROACH:
- Sound refined, calm, trustworthy, and DEEPLY INFORMED — like a curator or historian
- Write in ${lang} with elegant spoken rhythm suitable for premium travel audio
- The narration must feel timeless and evergreen, not tied to any exact flight path or moment
- The listener may start this audio at any point during a flight, so the story must still make sense

ABSOLUTE BALLOON RULES:
- DO NOT use directional language: left, right, below, above, ahead, behind, beneath, overhead, in front of you, to your side
- DO NOT claim live flight conditions: altitude, wind, route, drift, now flying, currently, at this moment, we are passing, we are rising
- DO NOT use walking-tour guidance: next stop, step closer, turn around, move on
- DO NOT imply exact real-time positioning or a guaranteed view
- DO NOT fabricate facts or overstate certainty

ABSOLUTE NO-ABBREVIATIONS RULE (CRITICAL — applies to ALL languages):
- NEVER use any abbreviations, initialisms, or acronyms in the narration
- Write "before the common era" instead of BCE or BC
- Write "common era" instead of CE or AD
- Write "Saint" instead of St.
- Write "Mount" instead of Mt.
- Write "meters" instead of m, "kilometers" instead of km
- Write "square kilometers" instead of km², "years" instead of yrs
- Write "United Nations Educational, Scientific and Cultural Organization" or just use the name once then say "the organization" — avoid UNESCO as initials if possible (but you may say "UNESCO" since it's commonly spoken as one word)
- Write "for example" instead of e.g., "that is" instead of i.e.
- Write numbers as words when natural: "nine million years" not "9 million years" only for dramatic impact — but specific measurements like 3,917 meters should be written as digits+words not abbreviations
- Never use symbols in place of words: "and" not &, "percent" not %, "degrees" not °
- This applies to EVERY language — in Turkish, French, German, etc., ALL abbreviations are forbidden too

ANTI-SHALLOW RULES (CRITICAL — SCRIPT WILL BE REJECTED IF VIOLATED):
- EVERY paragraph must contain at least one SPECIFIC fact: a named place, a date, a measurement, a historical figure, or a cultural detail
- NO generic statements like "this is a beautiful place" or "the views are amazing" or "nature is incredible"
- NO filler sentences — every sentence must earn its place by adding information or emotion
- Use SPECIFIC names from the knowledge base: Mount Erciyes (3,917 meters), Mount Hasan (3,253 meters), Göllü Dag
- Use SPECIFIC dates: "between 9 and 5 million years ago", "in the 4th century", "until 1952", "in 1985"
- Use SPECIFIC numbers: "3,000 rock-cut churches", "150-meter-thick tuff layer", "40-meter fairy chimneys", "20,000 people sheltered in Kaymakli"
- Use SPECIFIC cultural references: Byzantine, Seljuk, Ottoman, Hittite, Phrygian (not just "ancient")

VISIBLE LANDSCAPE COVERAGE (CRITICAL):
- The balloon flies OVER the takeoff valley but the flight corridor reveals MANY more valleys and landmarks
- Your narration MUST treat the visible landscape listed in the knowledge base as the true content
- When this chunk covers valleys/landmarks, you MUST mention SPECIFIC ones from the knowledge base by name
- Each visible valley/landmark deserves a distinct identity — do NOT treat them as interchangeable
- If chunk focuses on "valleys", cover MULTIPLE visible valleys with their unique features (not just one)

STORYTELLING DEPTH REQUIREMENTS:
- Weave local legends naturally: Camel Rock guarding Silk Road caravans, Love Valley's two lovers, Saint Simeon on his pillar, abandoned Cavusin, the dragon of Nar Lake
- Include etymology when relevant: peri bacası means fairy chimney, Peristrema means place of calm, Güvercinlik means pigeon house
- Explain WHY things are the way they are: why fairy chimneys form (basalt caps), why pigeons were kept (fertilizer), why underground cities were built (Arab raids), why Cavusin was abandoned (1950s rockfall)
- Include sensory description WITHOUT direction: "the light turns rose and amber at sunset", "wind carries the scent of apricot orchards", "the landscape holds a stillness found nowhere else"

EVERGREEN LANGUAGE PATTERNS:
- Instead of "below you" → "across the Anatolian plateau"
- Instead of "to your right" → "to the north, the land rises toward..."
- Instead of "now you are over" → "this region contains..."
- Instead of "look at" → "consider" or "picture"
- Use language that invites imagination without directing the gaze

DELIVERY RULES:
- This is ONE CHUNK of a larger continuous narration — focus only on this chunk's topic
- Target EXACTLY ${wordCount} words — this chunk is ${estimatedMinutes} minutes of audio
- The script MUST be at least ${Math.floor(wordCount * 0.9)} words and no more than ${Math.ceil(wordCount * 1.1)} words
- Use short spoken paragraphs separated by blank lines
- Stay focused on THIS chunk's subject — don't cover topics that belong to other chunks
- No markdown, no headers, no bullet points, no quotation marks, no em-dashes, no en-dashes
- Write for TTS, with natural variation in rhythm and sentence length
- Keep it immersive through ideas, not live directions

EXAMPLES OF GOOD VS BAD WRITING:
GOOD: "The three-capped fairy chimneys of Pasabag, rising like stone trees, once sheltered monks imitating Saint Simeon Stylites, the fifth-century ascetic who lived atop a pillar for thirty-seven years."
BAD: "There are unusual rocks in Pasabag where monks used to live a long time ago."

GOOD: "Pigeon Valley earned its name from thousands of dovecotes carved into the cliffs, where farmers collected nitrogen-rich droppings to fertilize vineyards that have produced wine since Byzantine times."
BAD: "Pigeon Valley has many pigeons and locals use them."

GOOD: "Kaymakli Underground City descends eight levels into the earth, connected to Derinkuyu by nine kilometers of tunnels, capable of sheltering up to twenty thousand people during Arab raids."
BAD: "There are underground cities where people hid from enemies in the past."`;

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

    const balloonUserPrompt = `Write ONE CHUNK (${section.title}) of the multi-chunk balloon experience narration for ${place} in ${city}, ${country}.

CHUNK DETAILS:
- Title: ${section.title}
- Subtitle: ${section.subtitle || ''}
- Key topics this chunk must cover: ${(section.key_topics || []).join(', ')}
- Theme: ${flight_theme || 'Balanced overview'}
- Takeoff valley(s): ${valleys.length ? valleys.join(', ') : 'Not specified'}
- Mood: ${section.mood || 'awe-inspiring'}
- Fun fact to include in this chunk: ${section.fun_fact || ''}
- This chunk length: ${estimatedMinutes} minutes (~${wordCount} words)
${previous_ending ? `
CONTINUITY — The previous chunk ended with:
"""${previous_ending}"""

Open this chunk with a natural transition. Do NOT restart from scratch or re-introduce the topic. Continue the flow.
` : `
This is the OPENING chunk. Open with a cinematic, evocative hook that captures why this landscape is unique on Earth.
`}
${next_title ? `
The next chunk will be: "${next_title}"
End this chunk with a graceful transition that prepares for the next topic without explicitly announcing it.
` : `
This is the FINAL chunk. End with a reflective, memorable closing that honors the timelessness of the landscape.
`}

CHUNK WRITING REQUIREMENTS:
1. Stay LASER-FOCUSED on this chunk's key topics — don't drift to other chunks' content
2. Draw SPECIFIC facts from the flight area knowledge base provided in the system prompt
3. Use named places, dates, and numbers (Mount Erciyes 3,917 meters, nine million years, 3,000 churches, etc.)
4. Include at least one hidden gem OR local legend relevant to this chunk's topic
5. Every paragraph must advance knowledge — no filler
6. Sensory description WITHOUT direction — evoke, don't direct

FINAL OUTPUT CHECK — before returning, verify your script contains NONE of these abbreviations:
- BCE, BC, CE, AD → write "before the common era" / "common era"
- St., Mt. → write "Saint", "Mount"
- m, km, km², yrs → write "meters", "kilometers", "square kilometers", "years"
- e.g., i.e., etc. → write "for example", "that is", "and so on"
- & → "and"
- % → "percent"
- Any other initialism or shortened form — spell it out fully

Critical writing rules:
- No directional cues
- No live flight claims
- No real-time route narration
- No walking-tour language
- No false immediacy
- Every paragraph must still be accurate if the balloon route changes completely

CHUNK LENGTH REQUIREMENT:
- This chunk must be EXACTLY ${wordCount} words (minimum ${Math.floor(wordCount * 0.9)})
- It's ${estimatedMinutes} minutes of one continuous narration — this single chunk, not the full guide
- Stay on topic — don't summarize everything, cover only what this chunk focuses on
- Use rich storytelling, historical depth, and sensory detail within your chunk's scope

Write pure narration text only in ${lang}. Target for this chunk: ${wordCount} words.`;

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
        // Per-chunk: 5 min = 725 words ≈ 1100 tokens. 4000 is safe headroom for up to ~2500 words
        max_tokens: 4000,
        temperature: isBalloonMode ? 0.55 : 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate section script');
    }

    const data = await response.json();
    let script = data.choices[0].message.content.trim()
      .replace(/["“”]/g, '')
      .replace(/[‘’]/g, "'")
      .replace(/[—]/g, ', ')
      .replace(/[–]/g, ', ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n');

    if (isBalloonMode && balloonViolationPattern.test(script)) {
      const rewriteResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `Rewrite balloon audio narration so it stays premium, factual, and fully evergreen. Remove all live-flight language, directional cues, real-time framing, and walking-tour phrasing. Keep the same facts and elegant tone. Return only the rewritten narration in ${lang}.`,
            },
            {
              role: 'user',
              content: `Rewrite this narration to remove anything that sounds like live flight guidance or immediate positioning. Do not use phrases such as as you float, below, above, left, right, currently, in this moment, or similar. Keep it natural and premium.\n\n${script}`,
            },
          ],
          max_tokens: 4200,
          temperature: 0.35,
        }),
      });

      if (rewriteResponse.ok) {
        const rewriteData = await rewriteResponse.json();
        script = rewriteData.choices[0].message.content.trim()
          .replace(/["“”]/g, '')
          .replace(/[‘’]/g, "'")
          .replace(/[—]/g, ', ')
          .replace(/[–]/g, ', ')
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n');
      }
    }

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
