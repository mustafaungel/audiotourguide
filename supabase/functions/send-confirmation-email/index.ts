import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PremiumConfirmationEmail } from './_templates/premium-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  guideId: string;
  guideTitle: string;
  accessCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[SEND-CONFIRMATION-EMAIL] Function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, guideId, guideTitle, accessCode }: ConfirmationEmailRequest = await req.json();
    console.log("[SEND-CONFIRMATION-EMAIL] Processing email for:", { email, guideId, guideTitle });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get guide details
    const { data: guide, error: guideError } = await supabase
      .from("audio_guides")
      .select("*")
      .eq("id", guideId)
      .single();

    if (guideError || !guide) {
      throw new Error("Guide not found");
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://audiotourguide.app";
    const guideUrl = `${siteUrl}/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`;

    // Format purchase date
    const purchaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format price
    const formattedPrice = guide.price_usd ? `$${(guide.price_usd / 100).toFixed(2)}` : '$12.00';

    // Render premium email template
    const html = await renderAsync(
      React.createElement(PremiumConfirmationEmail, {
        guideTitle: guideTitle,
        guideLocation: guide.location || 'Unknown Location',
        guideImageUrl: guide.image_urls?.[0] || guide.image_url,
        guideDuration: guide.duration || 7200, // Default 2 hours in seconds
        guideUrl: guideUrl,
        accessCode: accessCode,
        purchaseDate: purchaseDate,
        price: formattedPrice,
        currency: 'USD'
      })
    );

    const emailResponse = await resend.emails.send({
      from: "AudioGuide Premium <onboarding@resend.dev>",
      to: [email],
      subject: `🎧 Your ${guideTitle} Audio Guide is Ready!`,
      html: html,
    });

    console.log("[SEND-CONFIRMATION-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[SEND-CONFIRMATION-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);