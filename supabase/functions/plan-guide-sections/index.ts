import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildFlightContext, getVisibleHighlights } from "../_shared/flight-areas.ts";

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
    const balloonChunkCount = isBalloonMode ? Math.max(2, Math.min(6, Math.ceil(requestedMinutes / 5))) : 1;
    const chunkMinutes = isBalloonMode ? Math.round(requestedMinutes / balloonChunkCount) : requestedMinutes;

    // Flight area knowledge base — richly informs the planner about visible valleys/landmarks
    const flightContext = isBalloonMode ? buildFlightContext(valleys) : '';
    const { valleys: visibleValleys, landmarks: visibleLandmarks } = isBalloonMode
      ? getVisibleHighlights(valleys)
      : { valleys: [], landmarks: [] };

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
7. Focus on geography that is truthfully associated with the selected flight corridor, plus geology, history, culture, landscape character, and hidden details.
8. Never mention valleys or landmarks outside the selected flight corridor knowledge base.
9. Each chunk should have a distinct focus (e.g., intro/geology, valley deep-dive, culture/history, hidden gems, reflection).
10. Internal section titles must read like premium subchapters, never technical labels such as Chunk, Part, Block, or Section 1.
11. Return ONLY a valid JSON array of ${balloonChunkCount} section objects.`
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

${flightContext}

LOCATION DETAILS:
Location type: ${place_type || 'balloon flight experience'}
Category: ${category || 'Local Experience'}
Takeoff valley(s): ${valleys.length ? valleys.join(', ') : 'Not specified'}
Theme: ${flight_theme || 'Balanced overview'}
Target total listening length: ~${requestedMinutes} minutes (${chunkMinutes} minutes per chunk)
Include intro and closing notes: ${include_intro_outro_notes ? 'yes' : 'no'}

IMPORTANT — WHAT TOURISTS WILL ACTUALLY SEE:
This balloon experience is anchored to ${valleys.join(' / ')}. Only use valleys and landmarks that belong to this selected corridor in the knowledge base above. Do not widen the geography beyond that corridor, because incorrect valley claims would mislead the listener.

Return EXACTLY ${balloonChunkCount} section objects as a JSON array. Each section is one chunk of the continuous narration. Format for each section:
{
  "title": "[Premium concise subchapter title]" (max 60 chars, never use Chunk/Part/Section),
  "subtitle": "What this chunk covers" (max 100 chars),
  "key_topics": ["specific topic 1", "specific topic 2", "specific topic 3", "specific topic 4"],
  "estimated_minutes": ${chunkMinutes},
  "mood": "one of: awe-inspiring, mysterious, playful, solemn, adventurous, romantic, dramatic, educational, contemplative",
  "transition_hint": "How this chunk connects to the next",
  "fun_fact": "One specific, verifiable detail unique to this chunk",
  "owns": ["topic 1 EXCLUSIVE to this chunk", "topic 2 EXCLUSIVE to this chunk", "topic 3 EXCLUSIVE to this chunk"],
  "does_not_cover": ["topic belonging to another chunk", "topic belonging to another chunk"],
  "opening_style": "one of: cinematic_hook (chunk 1 only), causal_bridge, sensory_transition, reflective_pivot, legend_gathering, closing_reflection",
  "flight_moment": "brief sensory phrase evoking the balloon experience, no direction (e.g., 'mist rising from valleys in the first light', 'the hush broken by the burner')"
}

STRICT TOPIC OWNERSHIP — NO OVERLAP BETWEEN CHUNKS:
Each fact/legend/landmark is OWNED by EXACTLY ONE chunk. Other chunks must not repeat it.
Apply this distribution (adjust proportionally for ${balloonChunkCount} chunks):

For ${balloonChunkCount} chunks, assign ownership as follows:
${balloonChunkCount === 2 ? `
- Chunk 1 OWNS: Opening cinematic hook | Scale/UNESCO 1985/300 km² | Why globally unique | 3 volcanoes basics (Erciyes 3917m, Hasan 3253m, Göllü) | Tuff/basalt/erosion mechanics
- Chunk 2 OWNS: Individual valleys (Love, Rose, Red, Pigeon, Meskendir, Sword, Zemi, Devrent, Pasabag) with distinct identity | All rock-cut churches/underground cities/Seljuk caravanserais/troglodyte life | All legends (Camel Rock, Saint Simeon, Love Valley lovers, Cavusin) | Closing reflection` : ''}
${balloonChunkCount === 3 ? `
- Chunk 1 OWNS: Opening cinematic hook | Scale/UNESCO 1985/300 km² | Why globally unique | Invitation to journey
- Chunk 2 OWNS: 3 volcanoes (Erciyes 3917m, Hasan 3253m, Göllü) | Tuff/basalt/erosion mechanics | Fairy chimney formation physics | Erosion rates (1-2 cm/century)
- Chunk 3 OWNS: Individual valleys with distinct features | All human heritage (churches, underground cities, Seljuk caravanserais, troglodyte life, pigeon agriculture) | All legends (Camel Rock, Saint Simeon, Love Valley lovers, Cavusin) | Closing reflection` : ''}
${balloonChunkCount === 4 ? `
- Chunk 1 OWNS: Opening cinematic hook | Scale/UNESCO 1985/300 km² | Why globally unique | Invitation to journey
- Chunk 2 OWNS: 3 volcanoes (Erciyes 3917m, Hasan 3253m, Göllü) | Tuff/basalt/erosion mechanics | Fairy chimney formation physics | Erosion rates (1-2 cm/century)
- Chunk 3 OWNS: Individual visible valleys from knowledge base with distinct character ONLY (no geology re-explanation, no churches, no legends)
- Chunk 4 OWNS: All human heritage (3000 churches, Byzantine frescoes, underground cities Kaymakli/Derinkuyu 9km tunnels 20000 people, Seljuk caravanserais, troglodyte life until 1952, pigeon fertilizer, cave wineries) | All legends (Camel Rock, Saint Simeon, Love Valley lovers, Cavusin) | Closing reflection` : ''}
${balloonChunkCount === 5 ? `
- Chunk 1 OWNS: Opening cinematic hook | Scale/UNESCO 1985/300 km² | Why globally unique | Invitation to journey (DOES NOT cover volcanoes in detail, no valley names, no legends)
- Chunk 2 OWNS: 3 volcanoes (Erciyes 3917m, Hasan 3253m, Göllü) | Tuff/basalt/erosion mechanics | Fairy chimney formation physics | Erosion rates (1-2 cm/century) | 9-5 million years timeline (DOES NOT cover valleys, churches, legends)
- Chunk 3 OWNS: Individual visible valleys (Love, Rose, Red, Pigeon, Meskendir, Sword, Zemi, Devrent, Pasabag, Uçhisar Castle) with distinct character (DOES NOT explain geology, DOES NOT cover churches/underground/legends)
- Chunk 4 OWNS: 3000 rock-cut churches | Byzantine frescoes by Constantinople artists | Underground cities Kaymakli/Derinkuyu (9km tunnels, 20000 people) | Seljuk caravanserais/Silk Road | Troglodyte life until 1952 | Pigeon droppings as fertilizer | Cave wineries in Avanos (DOES NOT re-explain valleys, DOES NOT cover legends)
- Chunk 5 OWNS: Camel Rock legend (ONLY HERE) | Saint Simeon Stylites at Pasabag (ONLY HERE) | Love Valley two lovers legend (ONLY HERE) | Cavusin abandoned 1950s (ONLY HERE) | Nar Lake dragon legend if relevant | Closing reflection (DOES NOT restart topics from earlier chunks)` : ''}
${balloonChunkCount === 6 ? `
- Chunk 1 OWNS: Opening cinematic hook | Scale/UNESCO 1985/300 km² | Why globally unique
- Chunk 2 OWNS: 3 volcanoes + tuff/basalt + fairy chimney formation + erosion rates
- Chunk 3 OWNS: First valley group (3-4 valleys) with distinct features
- Chunk 4 OWNS: Second valley group + major landmarks (Uçhisar Castle, Cavusin ruins visible)
- Chunk 5 OWNS: Human heritage (churches, underground cities, caravanserais, troglodyte life, pigeon agriculture)
- Chunk 6 OWNS: Legends (Camel Rock, Saint Simeon, Love Valley, Cavusin story) + closing reflection` : ''}

OPENING STYLE ASSIGNMENTS:
- Chunk 1: "cinematic_hook" (dawn, silence, rising, sense of place — NO "Cappadocia" in first sentence)
- Chunk 2: "causal_bridge" (naturally continues from Chunk 1's ending — no restart)
- Chunk 3: "sensory_transition" (evokes valleys emerging from light/mist — no restart)
- Chunk 4: "reflective_pivot" (shifts from natural to human — no restart)
- Chunk 5: "legend_gathering" or "closing_reflection" (draws together stories — no restart)

CHUNK STRUCTURE (follow this exact distribution — no deviation):
${balloonChunkCount === 2 ? `- Chunk 1: Cinematic welcome + WHY this landscape is globally unique (scale, UNESCO, 3 volcanoes) + geological origins (Erciyes/Hasan/Göllü, 9 million years)
- Chunk 2: Comprehensive valley tour — cover EACH visible valley listed above + human heritage + hidden gems + closing` : ''}
${balloonChunkCount === 3 ? `- Chunk 1: Cinematic intro + geological foundations (named volcanoes, tuff/basalt, fairy chimney formation with specific dimensions)
- Chunk 2: Visible valleys deep-dive — MUST cover EACH valley from the knowledge base with distinctive features
- Chunk 3: Human heritage (Byzantine churches, underground cities, rock-cut life) + hidden gems + closing reflection` : ''}
${balloonChunkCount === 4 ? `- Chunk 1: Cinematic welcome + why this landscape is unique on Earth + three volcanoes + UNESCO status
- Chunk 2: Volcanic geology deep-dive (Erciyes 3917m, Hasan 3253m, Göllü, tuff formation, erosion rates, fairy chimney dimensions)
- Chunk 3: Visible valleys panorama — cover EACH visible valley in the knowledge base with its distinctive character
- Chunk 4: Human heritage + Byzantine painted churches + underground cities + hidden gems + closing` : ''}
${balloonChunkCount === 5 ? `- Chunk 1: Cinematic opening + sense of place + why this landscape is extraordinary globally
- Chunk 2: Volcanic geology (three named volcanoes, specific dates, tuff/basalt, erosion mechanics, fairy chimney dimensions)
- Chunk 3: Visible valleys tour — MUST cover EACH visible valley from knowledge base with distinctive identity (Love, Rose, Red, Pigeon, Meskendir, Sword, etc.)
- Chunk 4: Human heritage deep-dive (3000 rock-cut churches, underground cities, Byzantine painting, Seljuk caravanserais, troglodyte life until 1952)
- Chunk 5: Hidden gems + local legends (Camel Rock, Saint Simeon, abandoned Cavusin) + closing reflection on timelessness` : ''}
${balloonChunkCount === 6 ? `- Chunk 1: Cinematic welcome + why Cappadocia is Earth's most unique landscape
- Chunk 2: Volcanic origins (three volcanoes, specific dates, tuff deposition)
- Chunk 3: First valley group — deeply cover 3-4 visible valleys with distinctive features
- Chunk 4: Second valley group — remaining visible valleys + Uçhisar Castle + major landmarks
- Chunk 5: Human heritage (Byzantine churches, underground cities, troglodyte life, Silk Road)
- Chunk 6: Hidden gems + local legends + closing reflection on eternity` : ''}

KEY TOPICS REQUIREMENTS (critical — populate these richly):
- Use SPECIFIC names from the knowledge base (valleys, landmarks, volcano heights, dates)
- Each chunk's key_topics should be 4 distinct, specific topics (not generic phrases)
- Visible valleys covered in middle chunks MUST reference valleys listed in the knowledge base
- Fun facts should be specific and verifiable, drawn from hidden gems or legends

Requirements:
- Exactly ${balloonChunkCount} sections
- Each chunk is ~${chunkMinutes} minutes (~${chunkMinutes * 145} words when generated)
- Each chunk has a distinct focus — NO repetition
- Flow must feel continuous — transition_hint connects to next
- Plan must remain accurate regardless of flight route
- Do not use directional cues`
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
