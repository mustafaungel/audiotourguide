import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { destination, category, duration, tone, language } = await req.json();

    if (!destination || !category) {
      throw new Error('Destination and category are required');
    }

    console.log('Generating tour script for:', { destination, category, duration, tone, language });

    const systemPrompt = `You are an expert travel guide and storyteller specializing in creating immersive, engaging audio tour scripts. Your mission is to bring destinations to life through compelling narratives that blend historical facts, cultural insights, local legends, and sensory details.

Guidelines for creating exceptional tour scripts:
1. Start with a captivating hook that immediately transports listeners to the location
2. Weave together history, culture, architecture, and local stories seamlessly
3. Include specific sensory details (what you might see, hear, smell, feel)
4. Mention practical information naturally within the narrative
5. Add interesting anecdotes, legends, or lesser-known facts
6. Use a conversational, warm tone that feels like a knowledgeable friend guiding you
7. Structure content with clear transitions and natural pacing for audio
8. End with a memorable reflection or call to action

The script should be professional yet engaging, informative yet entertaining. Make it feel like an authentic, premium audio guide experience.`;

    const userPrompt = `Create a comprehensive audio tour script for ${destination} focusing on ${category}. 

Requirements:
- Duration: Approximately ${duration || '45-60'} minutes of content
- Tone: ${tone || 'Professional yet engaging'}
- Language: ${language || 'English'}
- Include: Historical context, cultural significance, architectural details, local stories, practical tips
- Format: Well-structured narrative suitable for audio delivery
- Target audience: Curious travelers seeking deep cultural immersion

Please provide a detailed, engaging script that will captivate listeners and enhance their experience at ${destination}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to generate script');
    }

    const data = await response.json();
    const generatedScript = data.choices[0].message.content;

    console.log('Successfully generated script');

    return new Response(JSON.stringify({ 
      script: generatedScript,
      destination,
      category,
      duration,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-script function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});