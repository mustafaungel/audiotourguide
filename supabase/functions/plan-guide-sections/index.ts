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

    const systemPrompt = isBalloonMode
      ? `You are a world-class travel editor and premium audio guide planner specializing in aerial sightseeing experiences.

Create a SINGLE long-form narration plan for a hot air balloon audio guide.

Critical balloon rules:
1. Return EXACTLY 1 section in a JSON array.
2. The narration must be evergreen and accurate even when the real flight path changes.
3. Do NOT use directional guidance such as left, right, below, ahead, behind, or above you.
4. Do NOT describe live conditions such as altitude, wind, exact route, current visibility, or current movement.
5. Do NOT write walking-tour logic such as next stop, step closer, turn around, or move forward.
6. Focus on general knowledge, geology, history, culture, landscape character, and hidden details.
7. If valleys are provided, each one must clearly appear in the section key topics.
8. Hidden gems and lesser-known details must be included.
9. Return ONLY a valid JSON array.`
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
      ? `Create a section plan for a premium balloon flight audio guide about ${place} in ${city}, ${country}.
Location type: ${place_type || 'balloon flight experience'}
Category: ${category || 'Local Experience'}
Covered valleys: ${valleys.length ? valleys.join(', ') : 'Not specified'}
Theme: ${flight_theme || 'Balanced overview'}
Target listening length: about ${requestedMinutes} minutes
Include intro and closing notes: ${include_intro_outro_notes ? 'yes' : 'no'}

Return EXACTLY one object in this format:
{
  "title": "A concise title for the long-form narration" (max 60 chars),
  "subtitle": "What the listener will discover" (max 100 chars),
  "key_topics": ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6"],
  "estimated_minutes": ${requestedMinutes},
  "mood": "one of: awe-inspiring, mysterious, playful, solemn, adventurous, romantic, dramatic, educational, contemplative",
  "transition_hint": "How the narrative should flow toward its closing reflection",
  "fun_fact": "One surprising but verifiable detail"
}

Requirements:
- Exactly 1 section only
- The single section must have a clear narrative arc: introduction, geological foundations, valley-by-valley overview, cultural history, hidden gems, reflection
- Every selected valley must be represented in key_topics or subtitle
- Emphasize volcanic history, tuff formations, erosion, rock-cut life, monastic history, pigeon houses, agriculture, and valley differences when relevant
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

    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('Planner returned no sections');
    }

    if (isBalloonMode) {
      sections = [sections[0]];
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
