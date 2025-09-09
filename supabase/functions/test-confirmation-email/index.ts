import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { PremiumConfirmationEmail } from "../send-confirmation-email/_templates/premium-confirmation.tsx";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  recipientEmail: string;
  recipientName: string;
  guideId: string;
  testData: {
    title: string;
    location: string;
    price_paid: number;
    currency: string;
    access_code: string;
    include_qr_code: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }

  try {
    const { recipientEmail, recipientName, guideId, testData }: TestEmailRequest = await req.json();

    console.log('Testing email with data:', {
      recipientEmail,
      recipientName,
      guideId,
      testData
    });

    // Prepare email template data
    const emailData = {
      guideName: testData.title,
      guideLocation: testData.location,
      customerName: recipientName,
      customerEmail: recipientEmail,
      accessCode: testData.access_code,
      purchaseAmount: testData.price_paid,
      currency: testData.currency,
      purchaseDate: new Date().toISOString(),
      guideUrl: `${Deno.env.get('SITE_URL')}/guide/${guideId}`,
      accessUrl: `${Deno.env.get('SITE_URL')}/audio-access?code=${testData.access_code}&guide=${guideId}`,
      supportEmail: 'support@audioguides.com',
      qrCodeUrl: testData.include_qr_code ? `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==` : undefined
    };

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(PremiumConfirmationEmail, emailData)
    );

    // Send the test email
    const emailResponse = await resend.emails.send({
      from: 'AudioGuides <test@audioguides.com>',
      to: [recipientEmail],
      subject: `[TEST] Your Premium Audio Guide: ${testData.title}`,
      html: emailHtml,
      headers: {
        'X-Test-Email': 'true',
        'X-Guide-ID': guideId,
        'X-Access-Code': testData.access_code
      }
    });

    console.log('Test email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${recipientEmail}`,
        emailId: emailResponse.data?.id,
        previewUrl: emailData.accessUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in test-confirmation-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);