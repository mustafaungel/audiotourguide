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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
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

    const { title, city, country, category } = await req.json();

    if (!title || !city || !country) {
      throw new Error('Title, city, and country are required');
    }

    console.log('Generating image with Gemini for:', { title, city, country, category });

    // Photorealistic prompt with place name text overlay
    const imagePrompt = `A stunning ultra-realistic photograph of ${title} in ${city}, ${country}. Golden hour lighting, professional travel photography, National Geographic quality. The text "${title}" is elegantly overlaid at the bottom of the image in a clean white sans-serif font with a subtle dark gradient behind it for readability. Photorealistic, sharp focus, vivid natural colors, cinematic composition, breathtaking view. ${category ? `${category} attraction.` : ''}`;

    // Call Gemini Nano Banana Pro API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '16:9', imageSize: '1K' }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract base64 image from Gemini response
    let imageBase64 = null;
    let mimeType = 'image/png';
    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageBase64) {
      console.error('No image data in Gemini response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image data received from Gemini');
    }

    // Upload to Supabase Storage
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const fileName = `generated-${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('guide-images')
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        cacheControl: '3600'
      });

    let imageUrl = null;
    if (!uploadError) {
      const { data: { publicUrl } } = supabaseClient.storage
        .from('guide-images')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    } else {
      console.error('Storage upload error:', uploadError);
    }

    console.log('Successfully generated and uploaded image:', { fileName, hasUrl: !!imageUrl });

    return new Response(JSON.stringify({
      image_url: imageUrl,
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
