import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, subject, message, category }: ContactEmailRequest = await req.json();

    // Get client IP and user agent for logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Store contact submission in database
    const { data: submission, error: submissionError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        category,
        ip_address: clientIP,
        user_agent: userAgent
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error storing contact submission:', submissionError);
      throw submissionError;
    }

    // Get email templates
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true);

    if (templateError) {
      console.error('Error fetching email templates:', templateError);
      throw templateError;
    }

    const confirmationTemplate = templates?.find(t => t.name === 'contact_confirmation');
    const adminTemplate = templates?.find(t => t.name === 'admin_notification');

    // Send confirmation email to user
    if (confirmationTemplate) {
      await resend.emails.send({
        from: "Audio Guides <noreply@lovableproject.com>",
        to: [email],
        subject: confirmationTemplate.subject,
        html: confirmationTemplate.html_content,
        text: confirmationTemplate.text_content || undefined,
      });
    }

    // Send notification email to admin (replace with your admin email)
    if (adminTemplate) {
      const adminHtml = adminTemplate.html_content
        .replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{subject}}/g, subject)
        .replace(/{{message}}/g, message);

      const adminText = adminTemplate.text_content
        ?.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{subject}}/g, subject)
        .replace(/{{message}}/g, message);

      await resend.emails.send({
        from: "Audio Guides Contact <admin@lovableproject.com>",
        to: ["admin@lovableproject.com"], // Replace with actual admin email
        subject: `[Contact Form] ${subject}`,
        html: adminHtml,
        text: adminText || undefined,
      });
    }

    console.log('Contact email sent successfully:', { name, email, subject, category });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your message has been sent successfully!',
        submissionId: submission.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send message. Please try again later.',
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);