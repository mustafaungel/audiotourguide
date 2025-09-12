import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

    const { sectionTitle, guideTitle, location, category } = await req.json();

    if (!sectionTitle || !guideTitle) {
      throw new Error('Section title and guide title are required');
    }

    console.log('Generating section description for:', { sectionTitle, guideTitle, location, category });

    // Create focused prompt for section descriptions
    const prompt = `Generate a compelling 2-3 sentence description for an audio guide section titled "${sectionTitle}" which is part of "${guideTitle}" audio guide${location ? ` in ${location}` : ''}${category ? ` (${category})` : ''}. 

The description should:
- Be engaging and informative (50-150 characters)
- Highlight what visitors will learn or experience in this specific section
- Use vivid, descriptive language that captures the essence of the location
- Be written for travelers who want to deeply understand the place

Focus on the unique aspects and interesting details of this particular section.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert travel content writer who creates compelling, concise descriptions for audio guide sections.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to generate section description');
    }

    const data = await response.json();
    let generatedDescription = data.choices[0].message.content.trim();
    
    // Ensure description is within reasonable length
    if (generatedDescription.length > 200) {
      generatedDescription = generatedDescription.substring(0, 197) + '...';
    }

    console.log('Generated section description successfully:', generatedDescription);

    return new Response(JSON.stringify({ 
      description: generatedDescription,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-section-description function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});