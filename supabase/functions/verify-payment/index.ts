import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");
    
    // Use service role key to bypass RLS for purchase creation
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id, guide_id } = await req.json();
    if (!session_id || !guide_id) throw new Error("Session ID and Guide ID are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { sessionId: session_id, status: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.user_id;
    const guestEmail = session.metadata?.guest_email;
    const isGuest = session.metadata?.is_guest === "true";

    if (!userId && !guestEmail) {
      throw new Error("Neither user ID nor guest email found in session metadata");
    }

    // Check if purchase record already exists
    let existingPurchase = null;
    if (userId) {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("guide_id", guide_id)
        .eq("stripe_payment_id", session_id)
        .single();
      existingPurchase = data;
    } else {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("guest_email", guestEmail)
        .eq("guide_id", guide_id)
        .eq("stripe_payment_id", session_id)
        .single();
      existingPurchase = data;
    }

    if (existingPurchase) {
      logStep("Purchase already recorded", { purchaseId: existingPurchase.id });
      return new Response(JSON.stringify({ success: true, purchaseId: existingPurchase.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate access code
    const { data: accessCodeData, error: accessCodeError } = await supabaseService
      .rpc("generate_access_code");

    if (accessCodeError) throw new Error("Failed to generate access code");

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseService
      .from("user_purchases")
      .insert({
        user_id: userId || null,
        guest_email: guestEmail || null,
        guide_id: guide_id,
        stripe_payment_id: session_id,
        price_paid: session.amount_total || 0,
        currency: session.currency || "usd",
        access_code: accessCodeData,
      })
      .select()
      .single();

    if (purchaseError) throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
    
    logStep("Purchase recorded successfully", { 
      purchaseId: purchase.id, 
      accessCode: purchase.access_code 
    });

    // Send confirmation email
    try {
      const emailResponse = await supabaseService.functions.invoke('send-confirmation-email', {
        body: {
          email: guestEmail || 'placeholder@example.com', // Use guest email or placeholder
          guideId: guide_id,
          guideTitle: 'Audio Guide Purchase', // This will be fetched in the email function
          accessCode: purchase.access_code
        }
      });
      
      if (emailResponse.error) {
        logStep("Email sending failed", { error: emailResponse.error });
      } else {
        logStep("Confirmation email sent successfully");
      }
    } catch (emailError) {
      logStep("Email error", { error: emailError });
      // Don't fail the whole process if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      purchaseId: purchase.id,
      accessCode: purchase.access_code 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});