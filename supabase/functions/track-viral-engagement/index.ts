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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, guide_id, platform, user_id, metadata = {} } = await req.json();

    switch (action) {
      case 'view':
        await supabaseClient.rpc('track_guide_view', { 
          p_guide_id: guide_id 
        });
        break;

      case 'share':
        await supabaseClient.rpc('track_viral_share', {
          p_guide_id: guide_id,
          p_platform: platform,
          p_location: metadata.location || null
        });
        break;

      case 'bookmark':
        if (user_id) {
          await supabaseClient
            .from('user_bookmarks')
            .insert({
              user_id,
              guide_id
            });
        }
        break;

      case 'achievement':
        if (user_id) {
          await supabaseClient
            .from('user_achievements')
            .insert({
              user_id,
              achievement_type: metadata.type,
              achievement_name: metadata.name,
              description: metadata.description,
              points: metadata.points || 10
            });
        }
        break;

      case 'update_trending':
        // Update trending locations based on guide engagement
        const { data: guide } = await supabaseClient
          .from('audio_guides')
          .select('location')
          .eq('id', guide_id)
          .single();

        if (guide?.location) {
          await supabaseClient
            .from('trending_locations')
            .upsert({
              name: guide.location,
              country: metadata.country || 'Unknown',
              guides_count: 1,
              total_views: 1,
              growth_percentage: Math.random() * 50 + 10
            }, {
              onConflict: 'name,country'
            });
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Calculate and update viral scores
    await supabaseClient.rpc('calculate_viral_score');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in track-viral-engagement function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to track engagement',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});