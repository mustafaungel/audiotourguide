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
    logStep("Request parameters received", { session_id, guide_id });
    
    if (!session_id || !guide_id) {
      const error = "Session ID and Guide ID are required";
      logStep("ERROR: Missing required parameters", { session_id: !!session_id, guide_id: !!guide_id });
      throw new Error(error);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Missing Stripe secret key");
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    logStep("Retrieving Stripe session", { sessionId: session_id });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { 
      sessionId: session_id, 
      status: session.payment_status,
      metadata: session.metadata
    });

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
      // For existing purchases, we need to fetch the access code
      const { data: existingPurchaseData } = await supabaseService
        .from("user_purchases")
        .select("access_code")
        .eq("id", existingPurchase.id)
        .single();
      
      return new Response(JSON.stringify({ 
        success: true, 
        purchaseId: existingPurchase.id,
        access_code: existingPurchaseData?.access_code 
      }), {
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

    // Generate QR code after successful purchase
    try {
      logStep("Generating QR code for purchased guide", { guideId: guide_id, accessCode: purchase.access_code });
      const qrResponse = await supabaseService.functions.invoke('generate-qr-code', {
        body: {
          guideId: guide_id,
          accessCode: purchase.access_code
        }
      });
      
      if (qrResponse.error) {
        logStep("QR code generation failed", { error: qrResponse.error });
      } else {
        logStep("QR code generated successfully", { qrData: qrResponse.data });
      }
    } catch (qrError) {
      logStep("QR code generation error", { error: qrError });
      // Don't fail the whole process if QR generation fails
    }

    // Fetch guide data for email
    const { data: guideData, error: guideError } = await supabaseService
      .from('audio_guides')
      .select('title')
      .eq('id', guide_id)
      .single();

    const guideTitle = guideData?.title || 'Audio Guide Purchase';
    const userEmail = guestEmail || userId ? `user-${userId}@example.com` : 'guest@example.com';

    // Send confirmation email
    try {
      logStep("Sending confirmation email", { email: userEmail, guideTitle, accessCode: purchase.access_code });
      const emailResponse = await supabaseService.functions.invoke('send-confirmation-email', {
        body: {
          email: userEmail,
          guideId: guide_id,
          guideTitle: guideTitle,
          accessCode: purchase.access_code
        }
      });
      
      if (emailResponse.error) {
        logStep("Email sending failed", { error: emailResponse.error });
      } else {
        logStep("Confirmation email sent successfully", { emailId: emailResponse.data?.emailId });
      }
    } catch (emailError) {
      logStep("Email function error", { error: emailError });
      // Don't fail the whole process if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      purchaseId: purchase.id,
      access_code: purchase.access_code 
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