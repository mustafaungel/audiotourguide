import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    console.log('Description generation request:', { type, data });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let systemPrompt = 'You are an expert travel content writer specializing in creating engaging, informative descriptions for travel industry applications.';

    if (type === 'destination') {
      // Generate destination description
      const { name, country, city, category } = data;
      systemPrompt += ' Create compelling destination descriptions that highlight unique features, cultural significance, and travel appeal.';
      prompt = `Write a detailed, engaging description for ${name} in ${city}, ${country}. 
                Category: ${category}. 
                Include:
                - Historical significance and cultural importance
                - What makes this destination unique
                - Key attractions and experiences
                - Best times to visit
                - What travelers can expect
                
                Keep it informative yet inspiring, 150-250 words.`;
    } else if (type === 'guide') {
      // Generate audio guide description
      const { title, destination, category, duration, audience } = data;
      systemPrompt += ' Create captivating audio guide descriptions that entice travelers and clearly communicate what the experience offers.';
      prompt = `Write an engaging description for an audio guide titled "${title}" for ${destination.name} in ${destination.city}, ${destination.country}.
                
                Guide details:
                - Category: ${category}
                - Duration: ${duration} minutes
                - Target audience: ${audience || 'general travelers'}
                
                The description should:
                - Highlight what makes this guide special
                - Explain what listeners will discover
                - Mention key points of interest covered
                - Create excitement about the experience
                - Be clear about the guide's focus and scope
                
                Keep it compelling and informative, 100-200 words.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const responseData = await response.json();
    const description = responseData.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Generated description:', description);

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-description function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate description',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});