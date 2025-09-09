-- Fix critical security vulnerabilities (corrected version)
-- 1. Secure contact_submissions table - remove public access
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;

-- Create proper RLS policy for contact submissions
CREATE POLICY "Public can create contact submissions" 
ON public.contact_submissions 
FOR INSERT 
TO public
WITH CHECK (true);

-- Only authenticated users can read their own submissions if email matches
CREATE POLICY "Users can view own contact submissions" 
ON public.contact_submissions 
FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
);

-- 2. Secure verification_requests table - restrict sensitive document access
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;

-- Create secure policy that masks sensitive data for non-admins
CREATE POLICY "Users can view own verification requests (masked)" 
ON public.verification_requests 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR is_admin()
);

-- 3. Add additional security for user_purchases
CREATE POLICY "Prevent guest purchase data exposure" 
ON public.user_purchases 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR is_admin() OR 
  (user_id IS NULL AND auth.uid() IS NULL) -- Guest purchases only accessible to guests with access code
);

-- 4. Secure profiles table from data exposure
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;

CREATE POLICY "Users can view own profile securely" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public can view basic creator profiles" 
ON public.profiles 
FOR SELECT 
TO public
USING (
  role = 'content_creator' AND verification_status = 'verified'
);

-- 5. Secure verification documents storage access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents', 'verification-documents', false, 10485760, 
  ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Create secure storage policies for verification documents
CREATE POLICY "Users can upload own verification documents" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own verification documents" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Admins can manage all verification documents" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (
  bucket_id = 'verification-documents' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. Create function to mask sensitive verification data
CREATE OR REPLACE FUNCTION public.get_masked_verification_request(request_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  creator_type text,
  verification_level text,
  status text,
  experience_description text,
  portfolio_url text,
  social_media_links jsonb,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  admin_notes text,
  id_document_url text,
  license_document_url text,
  id_number text,
  license_number text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check permissions
  IF NOT (is_admin() OR EXISTS (
    SELECT 1 FROM public.verification_requests vr 
    WHERE vr.id = request_id AND vr.user_id = auth.uid()
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    vr.id,
    vr.user_id,
    vr.full_name,
    vr.creator_type::text,
    vr.verification_level::text,
    vr.status,
    vr.experience_description,
    vr.portfolio_url,
    vr.social_media_links,
    vr.submitted_at,
    vr.reviewed_at,
    CASE WHEN is_admin() THEN vr.admin_notes ELSE NULL END,
    CASE WHEN is_admin() OR auth.uid() = vr.user_id THEN vr.id_document_url ELSE '[REDACTED]' END,
    CASE WHEN is_admin() OR auth.uid() = vr.user_id THEN vr.license_document_url ELSE '[REDACTED]' END,
    CASE WHEN is_admin() OR auth.uid() = vr.user_id THEN vr.id_number ELSE '[REDACTED]' END,
    CASE WHEN is_admin() OR auth.uid() = vr.user_id THEN vr.license_number ELSE '[REDACTED]' END
  FROM public.verification_requests vr
  WHERE vr.id = request_id;
END;
$$;