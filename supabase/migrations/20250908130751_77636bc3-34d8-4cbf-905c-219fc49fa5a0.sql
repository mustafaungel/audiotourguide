-- CRITICAL SECURITY FIX: Secure identity verification documents (Fixed version)
-- Issue: Identity documents could be accessed by hackers through direct URLs

-- Ensure the verification-documents bucket is properly configured as private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents', 
  'verification-documents', 
  false,  -- CRITICAL: Must be private
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Create secure RLS policies for verification documents storage
-- Use conditional policy creation to avoid conflicts

DO $$
BEGIN
  -- Policy 1: Only document owners can view their own verification documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'User can view own verification documents'
  ) THEN
    EXECUTE 'CREATE POLICY "User can view own verification documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''verification-documents'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy 2: Only document owners can upload their own verification documents  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'User can upload own verification documents'
  ) THEN
    EXECUTE 'CREATE POLICY "User can upload own verification documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''verification-documents'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy 3: Only document owners can update their own verification documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'User can update own verification documents'
  ) THEN
    EXECUTE 'CREATE POLICY "User can update own verification documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''verification-documents'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy 4: Only document owners can delete their own verification documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'User can delete own verification documents'
  ) THEN
    EXECUTE 'CREATE POLICY "User can delete own verification documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''verification-documents'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  -- Policy 5: Admins can access all verification documents for review
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can access all verification documents'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can access all verification documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''verification-documents'' AND public.is_admin())';
  END IF;
END $$;

-- Create a secure function to validate and log document access
CREATE OR REPLACE FUNCTION public.validate_verification_document_access(
  p_document_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requesting_user_id TEXT;
  document_owner_id TEXT;
  is_admin_user BOOLEAN;
  access_granted BOOLEAN := false;
BEGIN
  requesting_user_id := auth.uid()::text;
  
  -- Extract owner ID from document path (format: user_id/filename)
  document_owner_id := split_part(p_document_path, '/', 1);
  
  -- Check if requesting user is admin
  is_admin_user := public.is_admin();
  
  -- Grant access if user owns document or is admin
  access_granted := (requesting_user_id = document_owner_id OR is_admin_user);
  
  -- Log the access attempt for security auditing
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_access_attempt',
    'storage',
    NULL,
    access_granted,
    CASE WHEN NOT access_granted THEN 'Access denied to verification document' ELSE NULL END,
    jsonb_build_object(
      'document_path', p_document_path,
      'is_admin_access', is_admin_user,
      'access_granted', access_granted,
      'requesting_user', requesting_user_id,
      'document_owner', document_owner_id
    )
  );
  
  RETURN access_granted;
END;
$$;

-- Create function to securely delete verification documents
CREATE OR REPLACE FUNCTION public.secure_delete_verification_documents(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins or the user themselves can delete documents
  IF NOT (public.is_admin() OR auth.uid() = p_user_id) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to delete verification documents';
  END IF;
  
  -- Log the deletion action
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_deletion',
    'storage',
    p_user_id,
    true,
    NULL,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'deleted_by_admin', public.is_admin()
    )
  );
  
  -- Clear document URLs from verification requests
  UPDATE public.verification_requests 
  SET 
    id_document_url = NULL,
    license_document_url = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Add trigger to log verification document changes
CREATE OR REPLACE FUNCTION public.audit_verification_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when verification documents are modified
  IF TG_OP = 'UPDATE' AND (
    OLD.id_document_url IS DISTINCT FROM NEW.id_document_url OR
    OLD.license_document_url IS DISTINCT FROM NEW.license_document_url
  ) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'verification_document_modified',
      'verification_request',
      NEW.id,
      true,
      NULL,
      jsonb_build_object(
        'request_id', NEW.id,
        'user_id', NEW.user_id,
        'changes', jsonb_build_object(
          'id_document_changed', OLD.id_document_url IS DISTINCT FROM NEW.id_document_url,
          'license_document_changed', OLD.license_document_url IS DISTINCT FROM NEW.license_document_url
        )
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS audit_verification_documents ON public.verification_requests;
CREATE TRIGGER audit_verification_documents
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_verification_document_changes();

-- Create a secure view that masks sensitive document information
CREATE OR REPLACE VIEW public.secure_verification_requests AS
SELECT 
  id,
  user_id,
  full_name,
  creator_type,
  verification_level,
  status,
  document_status,
  experience_description,
  portfolio_url,
  social_media_links,
  social_verification_data,
  submitted_at,
  reviewed_at,
  reviewed_by,
  admin_notes,
  created_at,
  updated_at,
  -- Mask sensitive document information based on access rights
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN 
      CASE WHEN id_document_url IS NOT NULL THEN 'document_present' ELSE NULL END
    ELSE NULL 
  END as id_document_status,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN 
      CASE WHEN license_document_url IS NOT NULL THEN 'document_present' ELSE NULL END
    ELSE NULL 
  END as license_document_status,
  -- Only show actual URLs to authorized users
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN id_document_url
    ELSE NULL 
  END as id_document_url,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN license_document_url
    ELSE NULL 
  END as license_document_url,
  -- Mask sensitive numbers
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN id_number
    ELSE NULL 
  END as id_number,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN license_number
    ELSE NULL 
  END as license_number
FROM public.verification_requests;

-- Grant access to the secure view
GRANT SELECT ON public.secure_verification_requests TO authenticated;

-- Add a function to check if current user can access verification documents
CREATE OR REPLACE FUNCTION public.can_access_verification_documents(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Users can access their own documents, admins can access all
  RETURN (auth.uid() = p_user_id OR public.is_admin());
END;
$$;