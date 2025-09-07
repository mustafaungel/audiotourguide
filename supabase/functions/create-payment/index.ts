import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment function started");
    
    // Use service role key to bypass RLS for purchase operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get and validate origin for URL construction
    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    logStep("Origin header", { origin, referer: req.headers.get("referer") });

    const { guideId, guestEmail, isGuest } = await req.json();
    if (!guideId) throw new Error("Guide ID is required");

    let user = null;
    let userEmail = guestEmail;

    // Handle authentication for registered users
    if (!isGuest) {
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
      if (!guestEmail) throw new Error("Guest email is required");
      logStep("Guest checkout", { email: guestEmail });
    }

    // Fetch guide details
    const { data: guide, error: guideError } = await supabaseService
      .from("audio_guides")
      .select("*")
      .eq("id", guideId)
      .eq("is_published", true)
      .eq("is_approved", true)
      .single();

    if (guideError || !guide) throw new Error("Guide not found or not available for purchase");
    logStep("Guide found", { guideId, title: guide.title, price: guide.price_usd });

    // Check if user/guest has already purchased this guide
    let existingPurchase = null;
    if (user) {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("guide_id", guideId)
        .single();
      existingPurchase = data;
    } else {
      const { data } = await supabaseService
        .from("user_purchases")
        .select("id")
        .eq("guest_email", guestEmail)
        .eq("guide_id", guideId)
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
    }

    // Construct URLs with proper validation
    const successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&guide_id=${guideId}`;
    const cancelUrl = `${origin}/payment-cancelled`;
    logStep("Constructed URLs", { successUrl, cancelUrl });

    try {
      // Validate URLs
      new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test'));
      new URL(cancelUrl);
      logStep("URL validation passed");
    } catch (urlError) {
      logStep("URL validation failed", { error: urlError.message, origin });
      throw new Error(`Invalid URL construction: ${urlError.message}`);
    }

    // Fix image URL - convert relative paths to absolute or remove invalid ones
    let processedImageUrl = null;
    if (guide.image_url) {
      try {
        if (guide.image_url.startsWith('http')) {
          // Already absolute URL
          processedImageUrl = guide.image_url;
        } else if (guide.image_url.startsWith('/')) {
          // Relative path - convert to absolute
          processedImageUrl = `${origin}${guide.image_url}`;
        }
        // Validate the processed URL
        if (processedImageUrl) {
          new URL(processedImageUrl);
          logStep("Image URL processed", { original: guide.image_url, processed: processedImageUrl });
        }
      } catch (imageError) {
        logStep("Invalid image URL, excluding from Stripe", { 
          imageUrl: guide.image_url, 
          error: imageError.message 
        });
        processedImageUrl = null;
      }
    }

    // Create checkout session with detailed validation
    const productData = { 
      name: guide.title,
      description: guide.description,
    };
    
    // Only add images if we have a valid URL
    if (processedImageUrl) {
      productData.images = [processedImageUrl];
    }
    
    logStep("Product data prepared", { productData });

    const sessionData = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: guide.currency || "usd",
            product_data: productData,
            unit_amount: guide.price_usd * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment" as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user?.id || "",
        guest_email: isGuest ? guestEmail : "",
        is_guest: isGuest ? "true" : "false",
        guide_id: guideId,
      },
    };
    
    logStep("Creating Stripe session", { sessionData: { ...sessionData, line_items: "..." } });
    const session = await stripe.checkout.sessions.create(sessionData);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});