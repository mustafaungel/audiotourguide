import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing bearer token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    image_urls = [],
    best_time,
    sections = [],
    is_published = true,
    generate_audio = false
  } = await req.json();

    if (!title || !location || !category) {
      throw new Error('Title, location, and category are required');
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
        description: description || `Discover ${title} - an amazing audio guide experience`,
        location,
        category,
        duration: duration || Math.max(sections.reduce((total: number, section: any) => total + (section.duration_seconds || 300), 0), 45),
        difficulty: difficulty || 'Easy',
        languages: languages || ['English'],
        price_usd: price_usd >= 0 ? price_usd : 0, // Allow free guides (0 cents)
        audio_url: audioUrl,
        transcript: script,
        image_url: imageUrl || (image_urls?.length > 0 ? image_urls[0] : null),
        image_urls: image_urls,
        preview_url: previewUrl,
        creator_id: user.id,
        best_time,
        sections: JSON.stringify(sections),
        is_approved: true, // Auto-approve for now
        is_published: is_published, // Use the passed parameter
        is_standalone: true // Make visible in content management and listings
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
        description: section.description || section.content || '', // Handle both description and content, allow empty
        audio_url: section.audio_url,
        duration_seconds: section.duration_seconds || 300,
        language: section.language || 'English',
        language_code: 'en',
        order_index: index
      }));

      const { error: sectionsError } = await supabaseServiceClient
        .from('guide_sections')
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error('Error creating sections:', sectionsError);
      }
    }

    // Generate master access code and share link for ALL guides (published and hidden)
    let baseUrl = Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://audiotourguide.app';
    console.log('Raw SITE_URL environment variable:', Deno.env.get('SITE_URL'));
    console.log('Request origin header:', req.headers.get('origin'));
    console.log('Using base URL:', baseUrl);
    
    // Ensure baseUrl doesn't have trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // Generate master access code for all guides (unified access system)
    const masterAccessCodeResult = await supabaseServiceClient.rpc('generate_access_code');
    const masterAccessCode = masterAccessCodeResult.data;
    
    console.log('Final base URL after processing:', baseUrl);
    const shareUrl = `${baseUrl}/access/${guideData.id}?access_code=${masterAccessCode}`;
    console.log('Generated share URL with master access code:', shareUrl);
    console.log('Guide will be:', is_published ? 'PUBLISHED (discoverable + payment required)' : 'HIDDEN (access link only)');
    
    // Validate the share URL format (must have access code for direct access)
    if (!shareUrl.match(/^https?:\/\/.+\/access\/[a-f0-9-]+\?access_code=.+$/)) {
      throw new Error('Invalid share URL format generated');
    }
    
    // Generate QR code URL with proper encoding
    const encodedUrl = encodeURIComponent(shareUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodedUrl}`;
    
    // Validate QR code URL doesn't contain base64 data
    if (qrCodeUrl.includes('data=aHR0')) {
      throw new Error('QR code generation resulted in base64 encoding, which is invalid');
    }
    
    // Update guide with master access code, QR code and share URL (all guides get these)
    const { error: updateError } = await supabaseServiceClient
      .from('audio_guides')
      .update({
        master_access_code: masterAccessCode,
        qr_code_url: qrCodeUrl,
        share_url: shareUrl
      })
      .eq('id', guideData.id);

    if (updateError) {
      console.error('Failed to update guide with access link:', updateError);
      throw new Error('Failed to update guide with access link');
    }

    console.log('Successfully created audio guide:', guideData.id);
    console.log('Access Link:', shareUrl);
    console.log('QR Code URL:', qrCodeUrl);
    console.log('Status:', is_published ? 'Published (discoverable on main page)' : 'Hidden (access link only)');

    return new Response(JSON.stringify({ 
      guide: { ...guideData, qr_code_url: qrCodeUrl, share_url: shareUrl, master_access_code: masterAccessCode },
      message: `Audio guide created successfully and is now ${is_published ? 'published' : 'hidden'}!`,
      access_info: {
        type: is_published ? 'published' : 'hidden',
        share_url: shareUrl,
        description: is_published 
          ? 'Guide is discoverable on main page and requires payment. Access link provides direct access.'
          : 'Guide is hidden from main page. Only accessible via the access link.'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-guide function:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({ 
      error: `Failed to create guide: ${error.message}`,
      success: false,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});