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

    const { title, city, country, category } = await req.json();

    if (!title || !city || !country) {
      throw new Error('Title, city, and country are required');
    }

    console.log('Generating image for:', { title, city, country, category });

    // Create optimized prompt for travel destinations
    const imagePrompt = `Professional travel photography of ${title} in ${city}, ${country}, ${category ? `${category} attraction, ` : ''}scenic view, high quality, award-winning photography, vibrant colors, tourist perspective, ultra high resolution`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'webp',
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI Image API error:', error);
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('OpenAI response structure:', { dataKeys: Object.keys(data), hasData: !!data.data });
    
    // Handle different response formats for gpt-image-1
    let imageBase64;
    if (data.data && data.data[0]) {
      // Standard format
      imageBase64 = data.data[0].b64_json || data.data[0].revised_prompt;
    } else if (data.b64_json) {
      // Direct format
      imageBase64 = data.b64_json;
    } else if (data.image) {
      // Alternative format
      imageBase64 = data.image;
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from OpenAI');
    }

    console.log('Successfully generated image');

    return new Response(JSON.stringify({ 
      imageContent: imageBase64,
      prompt: imagePrompt,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});