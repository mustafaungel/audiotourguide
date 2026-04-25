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
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { guideId, accessCode, skipAuth } = await req.json();

    // For internal calls (background tasks), skip user authentication
    let user = null;
    if (!skipAuth) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !authUser) {
        throw new Error('Unauthorized');
      }
      user = authUser;
    }

    if (!guideId) {
      throw new Error('Guide ID is required');
    }

    console.log('Generating QR code for guide:', guideId);

    // Check if guide exists and belongs to user (for creators) or allow for admins
    const { data: guide, error: guideError } = await supabaseServiceClient
      .from('audio_guides')
      .select('id, creator_id, slug, master_access_code')
      .eq('id', guideId)
      .single();

    if (guideError || !guide) {
      throw new Error('Guide not found');
    }

    // Check permissions only if not skipping auth (for background tasks)
    if (!skipAuth && user) {
      const { data: profile } = await supabaseServiceClient
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';
      const isOwner = guide.creator_id === user.id;

      if (!isAdmin && !isOwner) {
        throw new Error('Unauthorized to generate QR code for this guide');
      }
    }

    // Get or generate master access code
    let masterAccessCode = guide.master_access_code;
    if (!masterAccessCode) {
      const masterAccessCodeResult = await supabaseServiceClient.rpc('generate_access_code');
      masterAccessCode = masterAccessCodeResult.data;
      
      // Update guide with master access code
      await supabaseServiceClient
        .from('audio_guides')
        .update({ master_access_code: masterAccessCode })
        .eq('id', guideId);
    }

    // Get the correct base URL from environment variable with live domain
    let baseUrl = Deno.env.get('SITE_URL') || 'https://audiotourguide.app';
    console.log('Raw SITE_URL environment variable:', baseUrl);
    
    // Ensure baseUrl doesn't have trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // Use live domain for production, override for development
    const origin = req.headers.get('origin');
    if (origin && origin.includes('sandbox.lovable.dev')) {
      baseUrl = 'https://audiotourguide.app'; // Always use live domain for QR codes
      console.log('Using live domain for QR code:', baseUrl);
    }
    
    console.log('Final base URL after processing:', baseUrl);
    const shareUrl = `${baseUrl}/access/${guideId}?access_code=${masterAccessCode}`;
    console.log('Generated share URL with master access code:', shareUrl);
    
    // Validate the share URL format (must have access code for direct access)
    if (!shareUrl.match(/^https?:\/\/.+\/access\/[a-f0-9-]+\?access_code=.+$/)) {
      throw new Error('Invalid share URL format generated');
    }
    
    // Generate QR code using external service with proper URL encoding
    const encodedUrl = encodeURIComponent(shareUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodedUrl}`;
    
    // Validate QR code URL doesn't contain base64 data
    if (qrCodeUrl.includes('data=aHR0')) {
      throw new Error('QR code generation resulted in base64 encoding, which is invalid');
    }
    
    // Update guide with QR code and share URL
    const { error: updateError } = await supabaseServiceClient
      .from('audio_guides')
      .update({
        qr_code_url: qrCodeUrl,
        share_url: shareUrl
      })
      .eq('id', guideId);

    if (updateError) {
      console.error('Failed to update guide with QR code:', updateError);
      throw new Error('Failed to update guide with QR code');
    }

    console.log('Successfully generated QR code for guide:', guideId);
    console.log('Share URL:', shareUrl);
    console.log('QR Code URL:', qrCodeUrl);

    return new Response(JSON.stringify({ 
      qr_code_url: qrCodeUrl,
      share_url: shareUrl,
      message: 'QR code generated successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-qr-code function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});