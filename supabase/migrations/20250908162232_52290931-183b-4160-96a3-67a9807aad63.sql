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
  ip_address INET,
  user_agent TEXT,
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
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for guide images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guide-images-uploads', 'guide-images-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on tables
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Contact submissions policies
CREATE POLICY "Anyone can submit contact forms" 
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

-- Email templates policies
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (is_admin());

-- Storage policies for guide images
CREATE POLICY "Anyone can view guide images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'guide-images-uploads');

CREATE POLICY "Admins can upload guide images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'guide-images-uploads' AND 
  is_admin()
);

CREATE POLICY "Admins can update guide images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'guide-images-uploads' AND 
  is_admin()
);

CREATE POLICY "Admins can delete guide images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'guide-images-uploads' AND 
  is_admin()
);

-- Add image_urls column to audio_guides for multiple images
ALTER TABLE public.audio_guides 
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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
('contact_confirmation', 'Thank you for contacting us!', 
'<h1>Thank you for reaching out!</h1><p>We have received your message and will get back to you within 24 hours.</p><p>Best regards,<br>The Audio Guides Team</p>',
'Thank you for reaching out! We have received your message and will get back to you within 24 hours. Best regards, The Audio Guides Team',
'contact'),
('admin_notification', 'New Contact Form Submission', 
'<h2>New Contact Form Submission</h2><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p><p><strong>Subject:</strong> {{subject}}</p><p><strong>Message:</strong> {{message}}</p>',
'New Contact Form Submission\n\nName: {{name}}\nEmail: {{email}}\nSubject: {{subject}}\nMessage: {{message}}',
'admin');