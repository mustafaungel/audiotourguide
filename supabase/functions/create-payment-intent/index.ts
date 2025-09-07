import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment intent function started");
    
    // Use service role key to bypass RLS for purchase operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { guide_id, guest_email, is_guest } = await req.json();
    if (!guide_id) throw new Error("Guide ID is required");

    let user = null;
    let userEmail = guest_email;

    // Handle authentication for registered users
    if (!is_guest) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header provided");
      
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      user = userData.user;
      if (!user?.email) throw new Error("User not authenticated or email not available");
      userEmail = user.email;
      logStep("User authenticated", { userId: user.id, email: user.email });
    } else {
      if (!guest_email) throw new Error("Guest email is required");
      logStep("Guest checkout", { email: guest_email });
    }

    // Fetch guide details
    const { data: guide, error: guideError } = await supabaseService
      .from("audio_guides")
      .select("*")
      .eq("id", guide_id)
      .eq("is_published", true)
      .eq("is_approved", true)
      .single();

    if (guideError || !guide) throw new Error("Guide not found or not available for purchase");
    logStep("Guide found", { guideId: guide_id, title: guide.title, price: guide.price_usd });

    // Check if user/guest has already purchased this guide
    let existingPurchase = null;
    if (user) {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("guide_id", guide_id)
        .single();
      existingPurchase = data;
    } else {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("guest_email", guest_email)
        .eq("guide_id", guide_id)
        .single();
      existingPurchase = data;
    }

    if (existingPurchase) {
      throw new Error("This guide has already been purchased");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    logStep("Stripe key retrieved", { keyExists: !!stripeKey, keyLength: stripeKey.length });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: user?.id || "",
          is_guest: is_guest ? "true" : "false",
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: guide.price_usd, // Already in cents from database
      currency: guide.currency || "usd",
      customer: customerId,
      metadata: {
        user_id: user?.id || "",
        guest_email: is_guest ? guest_email : "",
        is_guest: is_guest ? "true" : "false",
        guide_id: guide_id,
        guide_title: guide.title,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id, 
      amount: paymentIntent.amount,
      clientSecret: paymentIntent.client_secret?.substring(0, 10) + "..." 
    });

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-intent", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});