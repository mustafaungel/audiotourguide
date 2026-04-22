import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@4.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ContactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(254, 'Email too long'),
  
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters'),
  
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  
  category: z.enum(['general', 'support', 'business', 'feedback'])
});

// Sanitize string to prevent injection attacks
const sanitizeForEmail = (str: string): string => {
  return str
    .replace(/[\r\n]/g, '') // Remove newlines to prevent email header injection
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .trim();
};

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

    // Parse and validate input
    const body = await req.json();
    const validatedData = ContactSchema.parse(body);

    // Sanitize data for email templates
    const safeName = sanitizeForEmail(validatedData.name);
    const safeEmail = validatedData.email.toLowerCase();
    const safeSubject = sanitizeForEmail(validatedData.subject);
    const safeMessage = sanitizeForEmail(validatedData.message);

    // Get client IP and user agent for logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Store contact submission in database with sanitized data
    const { data: submission, error: submissionError } = await supabase
      .from('contact_submissions')
      .insert({
        name: safeName,
        email: safeEmail,
        subject: safeSubject,
        message: safeMessage,
        category: validatedData.category,
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
        to: [safeEmail],
        subject: confirmationTemplate.subject,
        html: confirmationTemplate.html_content,
        text: confirmationTemplate.text_content || undefined,
      });
    }

    // Send notification email to admin with sanitized data
    if (adminTemplate) {
      const adminHtml = adminTemplate.html_content
        .replace(/{{name}}/g, safeName)
        .replace(/{{email}}/g, safeEmail)
        .replace(/{{subject}}/g, safeSubject)
        .replace(/{{message}}/g, safeMessage);

      const adminText = adminTemplate.text_content
        ?.replace(/{{name}}/g, safeName)
        .replace(/{{email}}/g, safeEmail)
        .replace(/{{subject}}/g, safeSubject)
        .replace(/{{message}}/g, safeMessage);

      await resend.emails.send({
        from: "Audio Guides Contact <admin@lovableproject.com>",
        to: ["admin@lovableproject.com"],
        subject: `[Contact Form] ${safeSubject}`,
        html: adminHtml,
        text: adminText || undefined,
      });
    }

    console.log('Contact email sent successfully:', { name: safeName, email: safeEmail, category: validatedData.category });

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
    
    // Return validation errors with proper messaging
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation error',
          details: error.errors[0].message
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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
