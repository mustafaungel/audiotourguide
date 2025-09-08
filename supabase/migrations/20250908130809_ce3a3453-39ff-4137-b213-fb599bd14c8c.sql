-- CRITICAL SECURITY FIX: Secure identity verification documents (Handle existing policies)
-- Issue: Identity documents could be accessed by hackers through direct URLs

-- Ensure the verification-documents bucket exists and is private
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

-- Drop existing potentially insecure policies
DROP POLICY IF EXISTS "User can view own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "User can upload own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "User can update own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "User can delete own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all verification documents" ON storage.objects;

-- Create secure RLS policies for verification documents storage
-- Policy 1: Only document owners can view their own verification documents
CREATE POLICY "Secure verification docs view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- Policy 2: Only document owners can upload their own verification documents  
CREATE POLICY "Secure verification docs upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Only document owners can update their own verification documents
CREATE POLICY "Secure verification docs update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- Policy 4: Only document owners can delete their own verification documents
CREATE POLICY "Secure verification docs delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- Create a secure function to validate verification document access
CREATE OR REPLACE FUNCTION public.get_secure_verification_document_url(
  p_document_path TEXT,
  p_expires_in INTEGER DEFAULT 3600 -- 1 hour default
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requesting_user_id TEXT;
  document_owner_id TEXT;
  is_admin_user BOOLEAN;
BEGIN
  requesting_user_id := auth.uid()::text;
  
  -- Extract owner ID from document path (format: user_id/filename)
  document_owner_id := split_part(p_document_path, '/', 1);
  
  -- Check if requesting user is admin
  is_admin_user := public.is_admin();
  
  -- Security check: Only allow access to own documents or if admin
  IF requesting_user_id != document_owner_id AND NOT is_admin_user THEN
    -- Log the unauthorized access attempt
    PERFORM public.log_security_event(
      auth.uid(),
      'unauthorized_verification_document_access',
      'storage',
      NULL,
      false,
      'User attempted to access verification documents they do not own',
      jsonb_build_object(
        'requested_document_path', p_document_path,
        'document_owner_id', document_owner_id,
        'requesting_user_id', requesting_user_id
      )
    );
    
    RAISE EXCEPTION 'Access denied: You can only access your own verification documents';
  END IF;
  
  -- Log the legitimate access attempt for security auditing
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_access_granted',
    'storage',
    NULL,
    true,
    NULL,
    jsonb_build_object(
      'document_path', p_document_path,
      'is_admin_access', is_admin_user,
      'expires_in_seconds', p_expires_in
    )
  );
  
  -- Return the document path for client-side signed URL generation
  RETURN p_document_path;
END;
$$;

-- Create function to audit verification document operations
CREATE OR REPLACE FUNCTION public.audit_verification_document_operation(
  p_operation TEXT,
  p_document_path TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.log_security_event(
    auth.uid(),
    concat('verification_document_', p_operation),
    'storage',
    NULL,
    p_success,
    p_error_message,
    jsonb_build_object(
      'document_path', p_document_path,
      'operation', p_operation,
      'timestamp', now()
    )
  );
END;
$$;

-- Add trigger to log verification document changes
CREATE OR REPLACE FUNCTION public.log_verification_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when verification request documents are updated
  IF TG_OP = 'UPDATE' AND (
    OLD.id_document_url IS DISTINCT FROM NEW.id_document_url OR
    OLD.license_document_url IS DISTINCT FROM NEW.license_document_url
  ) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'verification_document_urls_updated',
      'verification_request',
      NEW.id,
      true,
      NULL,
      jsonb_build_object(
        'verification_request_id', NEW.id,
        'user_id', NEW.user_id,
        'old_id_document', OLD.id_document_url,
        'new_id_document', NEW.id_document_url,
        'old_license_document', OLD.license_document_url,
        'new_license_document', NEW.license_document_url,
        'status', NEW.status
      )
    );
  END IF;
  
  -- Log when sensitive data is accessed
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'verification_request_accessed',
      'verification_request',
      NEW.id,
      true,
      NULL,
      jsonb_build_object(
        'verification_request_id', NEW.id,
        'user_id', NEW.user_id,
        'has_id_document', (NEW.id_document_url IS NOT NULL),
        'has_license_document', (NEW.license_document_url IS NOT NULL)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for verification document change logging
DROP TRIGGER IF EXISTS verification_document_changes_log ON public.verification_requests;
CREATE TRIGGER verification_document_changes_log
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_document_changes();

-- Create a secure view that masks sensitive document URLs unless authorized
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
  -- Only include sensitive document info for authorized users
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN id_document_url
    ELSE CASE WHEN id_document_url IS NOT NULL THEN '[REDACTED - DOCUMENT PRESENT]' ELSE NULL END
  END as id_document_url,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN license_document_url
    ELSE CASE WHEN license_document_url IS NOT NULL THEN '[REDACTED - DOCUMENT PRESENT]' ELSE NULL END
  END as license_document_url,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN id_number
    ELSE CASE WHEN id_number IS NOT NULL THEN '[REDACTED]' ELSE NULL END
  END as id_number,
  CASE 
    WHEN public.is_admin() OR auth.uid() = user_id THEN license_number
    ELSE CASE WHEN license_number IS NOT NULL THEN '[REDACTED]' ELSE NULL END
  END as license_number
FROM public.verification_requests;

-- Grant appropriate permissions
GRANT SELECT ON public.secure_verification_requests TO authenticated;

-- Additional security: Function to check if a user can access specific verification documents
CREATE OR REPLACE FUNCTION public.can_access_verification_document(
  p_verification_request_id UUID,
  p_document_type TEXT -- 'id_document' or 'license_document'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_user_id UUID;
  is_admin_user BOOLEAN;
BEGIN
  -- Get the user_id of the verification request
  SELECT user_id INTO request_user_id
  FROM public.verification_requests
  WHERE id = p_verification_request_id;
  
  IF request_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  is_admin_user := public.is_admin();
  
  -- Log the access check
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_access_check',
    'verification_request',
    p_verification_request_id,
    true,
    NULL,
    jsonb_build_object(
      'document_type', p_document_type,
      'request_user_id', request_user_id,
      'is_admin_access', is_admin_user,
      'access_granted', (auth.uid() = request_user_id OR is_admin_user)
    )
  );
  
  -- Allow access if user owns the document or is admin
  RETURN (auth.uid() = request_user_id OR is_admin_user);
END;
$$;