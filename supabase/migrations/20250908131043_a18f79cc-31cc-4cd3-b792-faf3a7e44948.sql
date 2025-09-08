-- CRITICAL SECURITY FIX: Secure verification documents storage
-- Issue: Identity documents could be accessed by hackers through direct URLs

-- Ensure verification-documents bucket is properly secured
UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 10485760, -- 10MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'verification-documents';

-- Drop any existing overly permissive storage policies for verification documents
DO $$
BEGIN
    -- Drop policies that might exist with various names
    DROP POLICY IF EXISTS "User can view own verification documents" ON storage.objects;
    DROP POLICY IF EXISTS "User can upload own verification documents" ON storage.objects;
    DROP POLICY IF EXISTS "User can update own verification documents" ON storage.objects;
    DROP POLICY IF EXISTS "User can delete own verification documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can access all verification documents" ON storage.objects;
    DROP POLICY IF EXISTS "Secure verification docs view" ON storage.objects;
    DROP POLICY IF EXISTS "Secure verification docs upload" ON storage.objects;
    DROP POLICY IF EXISTS "Secure verification docs update" ON storage.objects;
    DROP POLICY IF EXISTS "Secure verification docs delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create highly secure RLS policies for verification documents
-- Only authenticated users can access documents in verification-documents bucket
-- AND they must either own the document OR be an admin

-- View policy: Users can only view their own documents or admins can view all
CREATE POLICY "Verification documents secure view access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (
    -- User can access their own documents (folder structure: user_id/filename)
    auth.uid()::text = (storage.foldername(name))[1]
    OR 
    -- Admins can access all verification documents
    public.is_admin()
  )
);

-- Upload policy: Users can only upload to their own folder
CREATE POLICY "Verification documents secure upload access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update policy: Users can only update their own documents, admins can update any
CREATE POLICY "Verification documents secure update access"
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

-- Delete policy: Users can only delete their own documents, admins can delete any
CREATE POLICY "Verification documents secure delete access"
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

-- Create secure function to validate and log verification document access attempts
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
  
  -- Determine if access should be granted
  access_granted := (requesting_user_id = document_owner_id OR is_admin_user);
  
  -- Log the access attempt (both successful and failed attempts)
  PERFORM public.log_security_event(
    auth.uid(),
    CASE WHEN access_granted THEN 'verification_document_access_granted' ELSE 'verification_document_access_denied' END,
    'storage',
    NULL,
    access_granted,
    CASE WHEN NOT access_granted THEN 'Unauthorized attempt to access verification document' ELSE NULL END,
    jsonb_build_object(
      'requested_document_path', p_document_path,
      'document_owner_id', document_owner_id,
      'requesting_user_id', requesting_user_id,
      'is_admin_access', is_admin_user,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN access_granted;
END;
$$;

-- Create function to securely mask sensitive verification data
CREATE OR REPLACE FUNCTION public.mask_verification_sensitive_data(
  p_user_id UUID,
  p_id_document_url TEXT,
  p_license_document_url TEXT,
  p_id_number TEXT,
  p_license_number TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  can_view_sensitive BOOLEAN;
BEGIN
  -- Check if current user can view sensitive data
  can_view_sensitive := (auth.uid() = p_user_id OR public.is_admin());
  
  -- Log access to sensitive data
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_sensitive_data_access',
    'verification_request',
    p_user_id,
    true,
    NULL,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'can_view_sensitive', can_view_sensitive,
      'has_id_document', (p_id_document_url IS NOT NULL),
      'has_license_document', (p_license_document_url IS NOT NULL),
      'has_id_number', (p_id_number IS NOT NULL),
      'has_license_number', (p_license_number IS NOT NULL)
    )
  );
  
  -- Return masked or full data based on permissions
  result := jsonb_build_object(
    'id_document_url', 
    CASE 
      WHEN can_view_sensitive THEN p_id_document_url
      WHEN p_id_document_url IS NOT NULL THEN '[REDACTED - DOCUMENT PRESENT]'
      ELSE NULL 
    END,
    'license_document_url',
    CASE 
      WHEN can_view_sensitive THEN p_license_document_url
      WHEN p_license_document_url IS NOT NULL THEN '[REDACTED - DOCUMENT PRESENT]'
      ELSE NULL 
    END,
    'id_number',
    CASE 
      WHEN can_view_sensitive THEN p_id_number
      WHEN p_id_number IS NOT NULL THEN '[REDACTED]'
      ELSE NULL 
    END,
    'license_number',
    CASE 
      WHEN can_view_sensitive THEN p_license_number
      WHEN p_license_number IS NOT NULL THEN '[REDACTED]'
      ELSE NULL 
    END
  );
  
  RETURN result;
END;
$$;

-- Add trigger to log when verification document URLs are accessed or modified
CREATE OR REPLACE FUNCTION public.audit_verification_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when verification documents are updated
  IF TG_OP = 'UPDATE' AND (
    OLD.id_document_url IS DISTINCT FROM NEW.id_document_url OR
    OLD.license_document_url IS DISTINCT FROM NEW.license_document_url
  ) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'verification_documents_modified',
      'verification_request',
      NEW.id,
      true,
      NULL,
      jsonb_build_object(
        'verification_request_id', NEW.id,
        'user_id', NEW.user_id,
        'document_changes', jsonb_build_object(
          'id_document_changed', (OLD.id_document_url IS DISTINCT FROM NEW.id_document_url),
          'license_document_changed', (OLD.license_document_url IS DISTINCT FROM NEW.license_document_url),
          'old_id_document_present', (OLD.id_document_url IS NOT NULL),
          'new_id_document_present', (NEW.id_document_url IS NOT NULL),
          'old_license_document_present', (OLD.license_document_url IS NOT NULL),
          'new_license_document_present', (NEW.license_document_url IS NOT NULL)
        ),
        'status', NEW.status,
        'modification_timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the audit trigger
DROP TRIGGER IF EXISTS audit_verification_document_access_trigger ON public.verification_requests;
CREATE TRIGGER audit_verification_document_access_trigger
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_verification_document_access();