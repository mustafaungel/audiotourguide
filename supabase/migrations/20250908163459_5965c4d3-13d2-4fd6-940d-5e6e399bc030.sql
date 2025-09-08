-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  admin_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type TEXT NOT NULL DEFAULT 'contact',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_submissions
CREATE POLICY "Anyone can create contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all contact submissions"
ON public.contact_submissions
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (is_admin());

-- Create policies for email_templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, template_type) VALUES
('contact_acknowledgment', 'Thank you for contacting us!', 
'<h1>Thank you for reaching out!</h1>
<p>Dear {{name}},</p>
<p>We have received your message and will get back to you within 24-48 hours.</p>
<p><strong>Subject:</strong> {{subject}}</p>
<p>Best regards,<br>The Support Team</p>',
'Thank you for reaching out!

Dear {{name}},

We have received your message and will get back to you within 24-48 hours.

Subject: {{subject}}

Best regards,
The Support Team',
'contact'),

('contact_response', 'Re: {{subject}}',
'<h1>Response to your inquiry</h1>
<p>Dear {{name}},</p>
<p>Thank you for your message. Here is our response:</p>
<div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
{{response_content}}
</div>
<p>If you have any further questions, please don''t hesitate to contact us.</p>
<p>Best regards,<br>The Support Team</p>',
'Response to your inquiry

Dear {{name}},

Thank you for your message. Here is our response:

{{response_content}}

If you have any further questions, please don''t hesitate to contact us.

Best regards,
The Support Team',
'contact');