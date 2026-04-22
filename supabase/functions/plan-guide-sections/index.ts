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
      place_type,
      category,
      mode,
      covered_valleys,
      flight_theme,
      estimated_listening_minutes,
      include_intro_outro_notes,
    } = await req.json();

    if (!country || !city || !place) {
      throw new Error('Country, city, and place are required');
    }

    const isBalloonMode = mode === 'balloon';
    const valleys = Array.isArray(covered_valleys) ? covered_valleys.filter(Boolean) : [];
    const requestedMinutes = Math.max(10, Math.min(30, Number(estimated_listening_minutes) || 15));

    // Balloon mode: split long narrations into multiple chunks for reliable generation
    // GPT-4o struggles to produce 2000+ words in a single call, so we chunk by duration
    // Each chunk targets 5 minutes (~725 words) for reliable output
    const balloonChunkCount = isBalloonMode ? Math.max(2, Math.min(6, Math.ceil(requestedMinutes / 5))) : 1;
    const chunkMinutes = isBalloonMode ? Math.round(requestedMinutes / balloonChunkCount) : requestedMinutes;

    const systemPrompt = isBalloonMode
      ? `You are a world-class travel editor and premium audio guide planner specializing in aerial sightseeing experiences.

Create a MULTI-CHUNK long-form narration plan for a hot air balloon audio guide. The narration will be split into ${balloonChunkCount} sequential chunks that together form one continuous premium narration.

Critical balloon rules:
1. Return EXACTLY ${balloonChunkCount} sections in a JSON array — each section is one chunk of the continuous narration.
2. The chunks must flow as ONE continuous story — chunk 1 introduces, middle chunks expand, last chunk concludes.
3. The narration must be evergreen and accurate even when the real flight path changes.
4. Do NOT use directional guidance such as left, right, below, ahead, behind, or above you.
5. Do NOT describe live conditions such as altitude, wind, exact route, current visibility, or current movement.
6. Do NOT write walking-tour logic such as next stop, step closer, turn around, or move forward.
7. Focus on general knowledge, geology, history, culture, landscape character, and hidden details.
8. If valleys are provided, distribute them across chunks — don't repeat the same valley in multiple chunks.
9. Each chunk should have a distinct focus (e.g., intro/geology, valley deep-dive, culture/history, hidden gems, reflection).
10. Return ONLY a valid JSON array of ${balloonChunkCount} section objects.`
      : `You are a world-class audio tour guide planner and historian. Your expertise spans art history, architecture, archaeology, cultural anthropology, and local traditions. You create audio tour section plans that transform ordinary visits into unforgettable experiences.

Your planning principles:
1. ACCURACY: Every historical date, name, and fact must be verifiable and correct. Do not invent or guess facts.
2. FLOW: Sections follow a logical visiting path through the location, as a real guide would walk visitors through.
3. PACING: Mix informational sections with atmospheric and experiential ones to maintain engagement.
4. DEPTH: Go beyond surface-level facts. Include expert-level insights, architectural details, artistic significance, and cultural context that visitors cannot get from a simple guidebook.
5. ENGAGEMENT: Each section must have a wow factor, a surprising fact, hidden detail, dramatic story, or compelling narrative that visitors would completely miss without a guide.

Section count: Create a comprehensive tour that covers ALL important and notable points of interest. The number of sections should match the actual size and richness of the location, do NOT artificially limit the count.

- Grand palaces, major museums, large complexes: 15-25 sections
- Major cathedrals, mosques, open-air museums: 10-19 sections
- Medium sites: 8-14 sections
- Small monuments, viewpoints, single structures: 4-8 sections

EVERY notable room, courtyard, artwork, architectural feature, and historical marker that a visitor would encounter deserves its own section. Do NOT group unrelated features together just to reduce the count. Return ONLY a valid JSON array.`;

    const userPrompt = isBalloonMode
      ? `Create a ${balloonChunkCount}-chunk narrative plan for a premium balloon flight audio guide about ${place} in ${city}, ${country}.
Location type: ${place_type || 'balloon flight experience'}
Category: ${category || 'Local Experience'}
Covered valleys: ${valleys.length ? valleys.join(', ') : 'Not specified'}
Theme: ${flight_theme || 'Balanced overview'}
Target total listening length: ~${requestedMinutes} minutes (${chunkMinutes} minutes per chunk)
Include intro and closing notes: ${include_intro_outro_notes ? 'yes' : 'no'}

Return EXACTLY ${balloonChunkCount} section objects as a JSON array. Each section is one chunk of the continuous narration. Format for each section:
{
  "title": "Chunk N: [Concise chunk title]" (max 60 chars),
  "subtitle": "What this chunk covers" (max 100 chars),
  "key_topics": ["topic1", "topic2", "topic3", "topic4"],
  "estimated_minutes": ${chunkMinutes},
  "mood": "one of: awe-inspiring, mysterious, playful, solemn, adventurous, romantic, dramatic, educational, contemplative",
  "transition_hint": "How this chunk connects to the next",
  "fun_fact": "One surprising detail specific to this chunk"
}

Chunk structure guide for ${balloonChunkCount} chunks:
${balloonChunkCount === 2 ? `- Chunk 1: Introduction + geological foundations (tuff rock, erosion, fairy chimneys)
- Chunk 2: Valley highlights + cultural history + reflection` : ''}
${balloonChunkCount === 3 ? `- Chunk 1: Introduction + geological foundations
- Chunk 2: Valley-by-valley deep dive + cultural history
- Chunk 3: Hidden gems + closing reflection` : ''}
${balloonChunkCount === 4 ? `- Chunk 1: Introduction + welcome + why this landscape is unique
- Chunk 2: Geology + tuff formation + fairy chimneys
- Chunk 3: Valleys + rock-cut life + monastic history
- Chunk 4: Hidden gems + local culture + closing reflection` : ''}
${balloonChunkCount === 5 ? `- Chunk 1: Introduction + cinematic opening + sense of place
- Chunk 2: Volcanic geology + tuff + erosion story
- Chunk 3: Valleys deep-dive (distribute ${valleys.length || 'all selected'} valleys)
- Chunk 4: Human history + rock-cut churches + pigeon houses + agriculture
- Chunk 5: Hidden gems + cultural reflections + closing` : ''}
${balloonChunkCount === 6 ? `- Chunk 1: Cinematic intro + welcome
- Chunk 2: Volcanic origins + landscape formation
- Chunk 3: First valley group + geological features
- Chunk 4: Second valley group + rock-cut heritage
- Chunk 5: Cultural layers + monastic history + daily life
- Chunk 6: Hidden gems + reflection + closing` : ''}

Requirements:
- Exactly ${balloonChunkCount} sections
- Each chunk is ~${chunkMinutes} minutes (~${chunkMinutes * 145} words when generated)
- Each chunk has a distinct focus — NO repetition of topics across chunks
- If multiple valleys, distribute them across middle chunks (don't stack in one chunk)
- Flow must feel continuous — transition_hint connects each chunk to the next
- The plan must remain correct regardless of the balloon route on a given day
- Do not mention live movement or directional cues`
      : `Create a comprehensive section plan for a professional audio tour of ${place} in ${city}, ${country}.
Location type: ${place_type || 'tourist attraction'}
Category: ${category || 'Historical'}

CRITICAL: You MUST create a MINIMUM of 15 sections for major landmarks like palaces, museums, and large complexes.

Research this specific location thoroughly. Include EVERY notable room, courtyard, gate, building, artwork, architectural feature, and historical marker that a visitor would encounter on the actual walking route. Do NOT merge distinct areas into one section.

For each section provide:
{
  "title": "Stop N – [Descriptive Name]" (max 60 chars),
  "subtitle": "What the visitor will discover here" (max 100 chars),
  "key_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "estimated_minutes": N,
  "mood": "one of: awe-inspiring, mysterious, playful, solemn, adventurous, romantic, dramatic, educational, contemplative",
  "transition_hint": "How this section connects to the next one",
  "fun_fact": "One surprising or little-known fact about this stop"
}

Requirements:
- Start with an engaging INTRODUCTION section
- End with a memorable CONCLUSION section
- EVERY notable room, artwork, architectural feature, and historical marker must have its own section
- All facts must be historically accurate and verifiable for ${place}
- Order sections in the logical visiting sequence following the actual visitor route
- Total tour duration should be 40-60+ minutes for major landmarks`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: isBalloonMode ? 0.35 : 0.4,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to plan guide sections');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    let sections;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sections = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse section plan');
    }

    if (!Array.isArray(sections)) {
      if (sections && typeof sections === 'object') {
        sections = [sections];
      } else {
        throw new Error('Planner returned no sections');
      }
    }

    if (sections.length === 0) {
      throw new Error('Planner returned no sections');
    }

    if (isBalloonMode) {
      // Keep only the requested number of chunks
      sections = sections.slice(0, balloonChunkCount);
    }

    return new Response(JSON.stringify({ sections }), {
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
