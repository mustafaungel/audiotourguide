import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const siteUrl = Deno.env.get('SITE_URL') || 'https://audiotourguide.app';

serve(async (req) => {
  console.log(`[ADMIN-QR] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[ADMIN-QR] Missing or invalid authorization header:', authHeader);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user token for auth check
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error('[ADMIN-QR] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('[ADMIN-QR] Access denied - not admin:', profileError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { guideId } = await req.json();
    
    if (!guideId) {
      return new Response(
        JSON.stringify({ error: 'Guide ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN-QR] Generating admin QR code for guide: ${guideId}`);

    // Get guide information
    const { data: guide, error: guideError } = await supabase
      .from('audio_guides')
      .select('id, title, slug')
      .eq('id', guideId)
      .single();

    if (guideError || !guide) {
      console.error('[ADMIN-QR] Guide not found:', guideError);
      return new Response(
        JSON.stringify({ error: 'Guide not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin share URL (points to purchase page using slug)
    const adminShareUrl = `${siteUrl}/guide/${guide.slug || guideId}`;
    
    // Generate QR code using external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(adminShareUrl)}`;
    
    console.log(`[ADMIN-QR] Generated admin QR code URL: ${qrCodeUrl}`);
    console.log(`[ADMIN-QR] Admin share URL: ${adminShareUrl}`);

    // Update the guide with admin QR code and share URL
    const { error: updateError } = await supabase
      .from('audio_guides')
      .update({
        admin_qr_code_url: qrCodeUrl,
        admin_share_url: adminShareUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', guideId);

    if (updateError) {
      console.error('[ADMIN-QR] Failed to update guide:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update guide with QR code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN-QR] Successfully updated guide ${guideId} with admin QR code`);

    return new Response(
      JSON.stringify({
        success: true,
        admin_qr_code_url: qrCodeUrl,
        admin_share_url: adminShareUrl,
        message: 'Admin QR code generated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN-QR] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});