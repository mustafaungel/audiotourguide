import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, trending_data, content_type = 'guide' } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate viral content based on trending data
    const viralPrompt = `Create a compelling ${content_type} for ${location}. 
    
    Context: This location is trending with the following data:
    ${trending_data ? JSON.stringify(trending_data) : 'High engagement on social media'}
    
    Requirements:
    - Make it engaging and shareable
    - Include interesting facts and hidden gems
    - Add elements that encourage social sharing
    - Keep it entertaining and informative
    - Include specific photo opportunities
    - Mention viral spots and Instagram-worthy locations
    
    Format: Provide a structured guide with title, description, key highlights, and social media hooks.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a viral travel content creator who specializes in creating engaging, shareable content that goes viral on social media. Focus on creating content that people want to share and experience.'
          },
          { role: 'user', content: viralPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Extract structured data from the generated content
    const contentLines = generatedContent.split('\n');
    let title = '';
    let description = '';
    let highlights = [];

    for (const line of contentLines) {
      if (line.toLowerCase().includes('title:') || line.startsWith('# ')) {
        title = line.replace(/title:|#/gi, '').trim();
      } else if (line.toLowerCase().includes('description:')) {
        description = line.replace(/description:/gi, '').trim();
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        highlights.push(line.replace(/^[*-]\s/, '').trim());
      }
    }

    // If no structured title found, create one
    if (!title) {
      title = `Viral Guide to ${location}`;
    }

    if (!description) {
      description = generatedContent.substring(0, 200) + '...';
    }

    return new Response(JSON.stringify({
      title,
      description,
      full_content: generatedContent,
      highlights,
      location,
      viral_score: Math.floor(Math.random() * 40) + 60, // Random viral score 60-100
      estimated_views: Math.floor(Math.random() * 50000) + 10000,
      shareable_moments: highlights.slice(0, 3),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-viral-content function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate viral content',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});