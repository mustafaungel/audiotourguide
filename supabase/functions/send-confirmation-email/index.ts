import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const guideUrl = `${Deno.env.get("SITE_URL")}/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`;

    const emailResponse = await resend.emails.send({
      from: "AudioGuide <onboarding@resend.dev>",
      to: [email],
      subject: `Your AudioGuide Purchase Confirmation - ${guideTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Purchase Confirmation</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Thank you for your purchase!</h2>
            <p>You have successfully purchased the audio guide:</p>
            <h3 style="color: #0066cc;">${guideTitle}</h3>
          </div>

          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Access Your Guide</h3>
            <p>Click the button below to access your audio guide:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${guideUrl}" 
                 style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Your Guide
              </a>
            </div>
            ${accessCode ? `<p style="font-size: 14px; color: #666;">Access Code: <strong>${accessCode}</strong></p>` : ''}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">📱 QR Code Available</h4>
            <p style="color: #856404; margin-bottom: 0;">Your QR code for easy access is now available on the guide page.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Thank you for choosing AudioGuide!<br>
              Enjoy your immersive audio experience.
            </p>
          </div>
        </div>
      `,
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