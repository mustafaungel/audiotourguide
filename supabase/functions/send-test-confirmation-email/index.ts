import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PremiumConfirmationEmail } from '../send-confirmation-email/_templates/premium-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
  guideId: string;
  guideTitle: string;
  accessCode: string;
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[SEND-TEST-CONFIRMATION-EMAIL] Function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, guideId, guideTitle, accessCode, location }: TestEmailRequest = await req.json();
    console.log("[SEND-TEST-CONFIRMATION-EMAIL] Processing test email for:", { email, guideId, guideTitle });

    let siteUrl = Deno.env.get("SITE_URL") || "https://audiotourguide.app";
    siteUrl = siteUrl.replace(/\/$/, '');
    
    const accessUrl = `${siteUrl}/access/${guideId}?access_code=${accessCode}`;
    console.log("[SEND-TEST-CONFIRMATION-EMAIL] Generated access URL:", accessUrl);

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(accessUrl)}`;

    // Render premium email template
    const html = await renderAsync(
      React.createElement(PremiumConfirmationEmail, {
        guideName: guideTitle,
        guideLocation: location || 'Unknown Location',
        customerName: undefined,
        customerEmail: email,
        purchaseAmount: 1200, // Default $12.00
        currency: 'USD',
        purchaseDate: new Date().toISOString(),
        accessUrl: accessUrl,
        supportEmail: 'support@audiotourguide.app',
        qrCodeUrl: qrCodeUrl,
        languages: ['English']
      })
    );

    const emailResponse = await resend.emails.send({
      from: "AudioGuide Premium <noreply@audiotourguide.app>",
      to: [email],
      subject: `🎧 Your ${guideTitle} Audio Guide is Ready! [RESEND]`,
      html: html,
      reply_to: "support@audiotourguide.app",
    });

    console.log("[SEND-TEST-CONFIRMATION-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      accessUrl: accessUrl
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[SEND-TEST-CONFIRMATION-EMAIL] Error:", error);
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