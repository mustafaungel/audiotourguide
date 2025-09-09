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

    let siteUrl = Deno.env.get("SITE_URL") || "https://audiotourguide.app";
    console.log("[SEND-CONFIRMATION-EMAIL] Raw SITE_URL:", siteUrl);
    
    // Ensure siteUrl doesn't have trailing slash
    siteUrl = siteUrl.replace(/\/$/, '');
    console.log("[SEND-CONFIRMATION-EMAIL] Cleaned siteUrl:", siteUrl);
    
    // Use master access code if available, fallback to provided access code
    let finalAccessCode = accessCode;
    if (guide.master_access_code) {
      finalAccessCode = guide.master_access_code;
    }
    
    const accessUrl = `${siteUrl}/access/${guideId}${finalAccessCode ? `?access_code=${finalAccessCode}` : ''}`;
    console.log("[SEND-CONFIRMATION-EMAIL] Generated access URL:", accessUrl);

    // Use the QR code from the guide if available, otherwise generate one with local hosting
    let qrCodeUrl = guide.qr_code_url;
    if (!qrCodeUrl) {
      // Use a more reliable QR code service with better deliverability
      qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(accessUrl)}&choe=UTF-8`;
    }

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
        supportEmail: 'hello@audiotourguide.app',
        qrCodeUrl: qrCodeUrl,
        languages: guide.languages || ['English']
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Audio Tour Guides <hello@audiotourguide.app>",
      to: [email],
      subject: `🎧 Your ${guideTitle} Audio Guide is Ready!`,
      html: html,
      reply_to: "hello@audiotourguide.app",
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