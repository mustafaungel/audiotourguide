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
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Service role for storage upload
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { title, city, country, category, prompt: customPrompt } = await req.json();

    if (!title || !city || !country) {
      throw new Error('Title, city, and country are required');
    }

    console.log('Generating image for:', { title, city, country, category });

    // Use custom prompt if provided, otherwise generate one
    const imagePrompt = customPrompt || `Ultra realistic, photorealistic professional travel photography of ${title} in ${city}, ${country}, ${category ? `${category} attraction, ` : ''}scenic view, award-winning photography, professional photographer, ultra high resolution, stunning detail, vibrant natural colors, perfect lighting, tourist perspective, masterpiece quality, National Geographic style`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
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
    
    // Handle dall-e-3 response format
    const imageBase64 = data.data[0].b64_json;
    if (!imageBase64) {
      console.error('No image data received:', data);
      throw new Error('No image data received from OpenAI');
    }

    // Upload to Supabase Storage
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const fileName = `guide-images/generated-${Date.now()}-${crypto.randomUUID()}.webp`;

    const { error: uploadError } = await supabaseClient.storage
      .from('guide-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600'
      });

    let imageUrl = null;
    if (!uploadError) {
      const { data: { publicUrl } } = supabaseClient.storage
        .from('guide-images')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    console.log('Successfully generated and uploaded image:', { fileName, hasUrl: !!imageUrl });

    return new Response(JSON.stringify({
      image_url: imageUrl,
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