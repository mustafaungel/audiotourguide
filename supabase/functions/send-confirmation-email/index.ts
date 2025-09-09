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
    const accessUrl = `${siteUrl}/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`;

    // Generate QR code for the access URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(accessUrl)}`;

    // Format purchase date
    const purchaseDate = new Date().toISOString();

    // Get purchase amount (convert from cents to display format)
    const purchaseAmount = guide.price_usd || 1200; // Default to $12.00 if not set

    // Render premium email template
    const html = await renderAsync(
      React.createElement(PremiumConfirmationEmail, {
        guideName: guideTitle,
        guideLocation: guide.location || 'Unknown Location',
        customerName: undefined, // We don't have customer name from purchase
        customerEmail: email,
        purchaseAmount: purchaseAmount,
        currency: guide.currency || 'USD',
        purchaseDate: purchaseDate,
        accessUrl: accessUrl,
        supportEmail: 'support@audiotourguide.app',
        qrCodeUrl: qrCodeUrl,
        languages: guide.languages || ['English']
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