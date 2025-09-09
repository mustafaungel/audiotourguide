import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { guestEmail } = await req.json();
    
    if (!guestEmail) {
      throw new Error("Guest email is required");
    }

    console.log(`[ADMIN-RESEND-EMAIL] Processing resend for: ${guestEmail}`);

    // Get all purchases for this guest email
    const { data: purchases, error: purchasesError } = await supabase
      .from("user_purchases")
      .select(`
        id, 
        guide_id, 
        access_code, 
        guest_email,
        audio_guides!inner(title, location)
      `)
      .eq("guest_email", guestEmail);

    if (purchasesError) {
      throw new Error(`Failed to fetch purchases: ${purchasesError.message}`);
    }

    if (!purchases || purchases.length === 0) {
      throw new Error(`No purchases found for email: ${guestEmail}`);
    }

    console.log(`[ADMIN-RESEND-EMAIL] Found ${purchases.length} purchases`);

    const emailResults = [];

    // Send confirmation email for each purchase
    for (const purchase of purchases) {
      try {
        console.log(`[ADMIN-RESEND-EMAIL] Sending email for guide: ${purchase.audio_guides.title}`);
        
        const emailResponse = await supabase.functions.invoke('send-test-confirmation-email', {
          body: {
            email: guestEmail,
            guideId: purchase.guide_id,
            guideTitle: purchase.audio_guides.title,
            accessCode: purchase.access_code,
            location: purchase.audio_guides.location
          }
        });

        if (emailResponse.error) {
          console.error(`[ADMIN-RESEND-EMAIL] Email failed for ${purchase.guide_id}:`, emailResponse.error);
          emailResults.push({
            guide_id: purchase.guide_id,
            title: purchase.audio_guides.title,
            success: false,
            error: emailResponse.error.message
          });
        } else {
          console.log(`[ADMIN-RESEND-EMAIL] Email sent successfully for ${purchase.guide_id}`);
          
          // Update the purchase record to mark email as sent
          await supabase
            .from("user_purchases")
            .update({
              email_sent: true,
              email_error: null
            })
            .eq("id", purchase.id);

          emailResults.push({
            guide_id: purchase.guide_id,
            title: purchase.audio_guides.title,
            success: true,
            access_code: purchase.access_code
          });
        }
      } catch (emailError) {
        console.error(`[ADMIN-RESEND-EMAIL] Exception for ${purchase.guide_id}:`, emailError);
        emailResults.push({
          guide_id: purchase.guide_id,
          title: purchase.audio_guides.title,
          success: false,
          error: emailError.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      guestEmail,
      totalPurchases: purchases.length,
      emailResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[ADMIN-RESEND-EMAIL] Error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});