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
    const authHeader = req.headers.get('Authorization')!;
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

  const { 
    title, 
    description, 
    location, 
    category, 
    duration, 
    difficulty, 
    languages, 
    price_usd, 
    script, 
    audio_content, 
    image_content, 
    best_time,
    sections = [],
    generate_audio = false
  } = await req.json();

    if (!title || !description || !location || !category) {
      throw new Error('Title, description, location, and category are required');
    }

    console.log('Creating audio guide:', { title, location, category, duration });

    // Upload image if provided
    let imageUrl = null;
    if (image_content) {
      const imageBuffer = Uint8Array.from(atob(image_content), c => c.charCodeAt(0));
      const fileName = `guides/${user.id}/${Date.now()}.webp`;
      
      const { data: imageData, error: imageError } = await supabaseServiceClient.storage
        .from('guide-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (imageError) {
        console.error('Error uploading image:', imageError);
      } else {
        const { data: { publicUrl } } = supabaseServiceClient.storage
          .from('guide-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // Upload audio if provided
    let audioUrl = null;
    let previewUrl = null;
    if (audio_content) {
      const audioBuffer = Uint8Array.from(atob(audio_content), c => c.charCodeAt(0));
      const audioFileName = `guides/${user.id}/${Date.now()}-full.mp3`;
      
      const { data: audioData, error: audioError } = await supabaseServiceClient.storage
        .from('guide-audio')
        .upload(audioFileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      if (audioError) {
        console.error('Error uploading audio:', audioError);
      } else {
        const { data: { publicUrl } } = supabaseServiceClient.storage
          .from('guide-audio')
          .getPublicUrl(audioFileName);
        audioUrl = publicUrl;

        // Create 15-second preview
        // For now, use the same URL - in production, you'd create actual previews
        previewUrl = audioUrl;
      }
    }

    // Create the audio guide record
    const { data: guideData, error: guideError } = await supabaseServiceClient
      .from('audio_guides')
      .insert({
        title,
        description,
        location,
        category,
        duration: duration || Math.max(sections.reduce((total: number, section: any) => total + (section.duration_seconds || 300), 0), 45),
        difficulty: difficulty || 'Easy',
        languages: languages || ['English'],
        price_usd: price_usd || 1200, // $12.00 default
        audio_url: audioUrl,
        transcript: script,
        image_url: imageUrl,
        preview_url: previewUrl,
        creator_id: user.id,
        best_time,
        sections: JSON.stringify(sections),
        is_approved: true, // Auto-approve for now
        is_published: true // Auto-publish for now
      })
      .select()
      .single();

    if (guideError) {
      console.error('Error creating guide:', guideError);
      throw new Error('Failed to create audio guide');
    }

    // Insert sections if provided
    if (sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        guide_id: guideData.id,
        title: section.title,
        description: section.description,
        audio_url: section.audio_url,
        duration_seconds: section.duration_seconds || 300,
        language: section.language || 'English',
        order_index: index
      }));

      const { error: sectionsError } = await supabaseServiceClient
        .from('guide_sections')
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error('Error creating sections:', sectionsError);
      }
    }

    // Generate QR code and share link
    const baseUrl = Deno.env.get('SITE_URL') || 'https://dsaqlgxajdnwoqvtsrqd.supabase.co';
    const shareUrl = `${baseUrl}/guides/${guideData.id}`;
    
    // Generate QR code (simplified for edge function)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    // Update guide with QR code and share URL
    await supabaseServiceClient
      .from('audio_guides')
      .update({
        qr_code_url: qrCodeUrl,
        share_url: shareUrl
      })
      .eq('id', guideData.id);

    console.log('Successfully created audio guide:', guideData.id);

    return new Response(JSON.stringify({ 
      guide: { ...guideData, qr_code_url: qrCodeUrl, share_url: shareUrl },
      message: 'Audio guide created successfully and is now published!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-guide function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});