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

    const { country, city, place, place_type, category } = await req.json();
    if (!country || !city || !place) {
      throw new Error('Country, city, and place are required');
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
            content: `You are a world-class audio tour guide planner and historian. Your expertise spans art history, architecture, archaeology, cultural anthropology, and local traditions. You create audio tour section plans that transform ordinary visits into unforgettable experiences.

Your planning principles:
1. ACCURACY: Every historical date, name, and fact must be verifiable and correct. Do not invent or guess facts.
2. FLOW: Sections follow a logical visiting path through the location, as a real guide would walk visitors through.
3. PACING: Mix informational sections with atmospheric and experiential ones to maintain engagement.
4. DEPTH: Go beyond surface-level facts. Include expert-level insights, architectural details, artistic significance, and cultural context that visitors cannot get from a simple guidebook.
5. ENGAGEMENT: Each section must have a "wow factor" — a surprising fact, hidden detail, dramatic story, or compelling narrative that visitors would completely miss without a guide.

Section count: Determine the optimal number based on the ACTUAL layout, size, and significance of this specific location. A massive open-air museum with 20 notable stops should have 20 sections. A small monument may only need 3-4. Let the location's real structure dictate the plan. Do NOT apply arbitrary limits.

Return ONLY a valid JSON array.`
          },
          {
            role: 'user',
            content: `Create a detailed section plan for a professional audio tour of ${place} in ${city}, ${country}.
Location type: ${place_type || 'tourist attraction'}
Category: ${category || 'Historical'}

For each section provide:
{
  "title": "Stop N – [Descriptive Name]" (max 60 chars),
  "subtitle": "What the visitor will discover here" (max 100 chars),
  "key_topics": ["topic1", "topic2", "topic3", "topic4"] (4-6 specific topics/stories to cover),
  "estimated_minutes": N (narration duration, 2-5 minutes per section),
  "mood": "one of: awe-inspiring, mysterious, playful, solemn, adventurous, romantic, dramatic, educational, contemplative",
  "transition_hint": "How this section connects to the next one",
  "fun_fact": "One surprising or little-known fact about this stop"
}

Requirements:
- Start with an engaging INTRODUCTION section (welcome, historical overview, what makes this place special)
- End with a memorable CONCLUSION section (reflection, best photo spots, what to see next)
- Each section should cover a distinct, real point of interest at this location
- All facts must be historically accurate and verifiable for ${place}
- Order sections in the logical visiting sequence a real guide would use`
          }
        ],
        max_tokens: 4000,
        temperature: 0.4,
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
