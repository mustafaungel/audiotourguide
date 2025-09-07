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

    const { guideId } = await req.json();

    if (!guideId) {
      throw new Error('Guide ID is required');
    }

    console.log('Generating QR code for guide:', guideId);

    // Check if guide exists and belongs to user (for creators) or allow for admins
    const { data: guide, error: guideError } = await supabaseServiceClient
      .from('audio_guides')
      .select('id, creator_id')
      .eq('id', guideId)
      .single();

    if (guideError || !guide) {
      throw new Error('Guide not found');
    }

    // Check permissions (admin or guide owner)
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

    // Generate QR code and share link
    const baseUrl = Deno.env.get('SITE_URL') || 'https://lovable.dev';
    const shareUrl = `${baseUrl}/guide/${guideId}`;
    
    // Generate QR code using external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    // Update guide with QR code and share URL
    const { error: updateError } = await supabaseServiceClient
      .from('audio_guides')
      .update({
        qr_code_url: qrCodeUrl,
        share_url: shareUrl
      })
      .eq('id', guideId);

    if (updateError) {
      throw new Error('Failed to update guide with QR code');
    }

    console.log('Successfully generated QR code for guide:', guideId);

    return new Response(JSON.stringify({ 
      qr_code_url: qrCodeUrl,
      share_url: shareUrl,
      message: 'QR code generated successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-qr-code function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});