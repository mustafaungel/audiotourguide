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

    const { sessionId, guideId } = await req.json();
    if (!sessionId || !guideId) throw new Error("Session ID and Guide ID are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { sessionId, status: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.user_id;
    if (!userId) throw new Error("User ID not found in session metadata");

    // Check if purchase record already exists
    const { data: existingPurchase } = await supabaseService
      .from("user_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("guide_id", guideId)
      .eq("stripe_payment_id", sessionId)
      .single();

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
        user_id: userId,
        guide_id: guideId,
        stripe_payment_id: sessionId,
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