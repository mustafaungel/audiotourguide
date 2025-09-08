-- CRITICAL SECURITY FIX: Secure identity verification documents
-- Fix the view creation issue and implement security measures

-- Ensure the verification-documents bucket is private and secure
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

-- Create secure storage policies for verification documents
-- First check and drop existing policies if they exist
DO $$
BEGIN
  -- Drop potentially insecure storage policies
  DROP POLICY IF EXISTS "User can view own verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "User can upload own verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "User can update own verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "User can delete own verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can access all verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "Secure verification docs view" ON storage.objects;
  DROP POLICY IF EXISTS "Secure verification docs upload" ON storage.objects;
  DROP POLICY IF EXISTS "Secure verification docs update" ON storage.objects;
  DROP POLICY IF EXISTS "Secure verification docs delete" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create new secure storage policies
CREATE POLICY "Verification documents secure view"
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

CREATE POLICY "Verification documents secure upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Verification documents secure update"
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

CREATE POLICY "Verification documents secure delete"
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

-- Create secure function to validate and log document access
CREATE OR REPLACE FUNCTION public.secure_verification_document_access(
  p_document_path TEXT,
  p_operation TEXT DEFAULT 'view'
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
  
  -- Log the access attempt
  PERFORM public.log_security_event(
    auth.uid(),
    CASE 
      WHEN access_granted THEN concat('verification_document_', p_operation, '_granted')
      ELSE concat('verification_document_', p_operation, '_denied')
    END,
    'storage',
    NULL,
    access_granted,
    CASE WHEN NOT access_granted THEN 'Access denied to verification document' ELSE NULL END,
    jsonb_build_object(
      'document_path', p_document_path,
      'operation', p_operation,
      'document_owner_id', document_owner_id,
      'requesting_user_id', requesting_user_id,
      'is_admin_access', is_admin_user,
      'access_granted', access_granted
    )
  );
  
  -- Raise exception if access denied
  IF NOT access_granted THEN
    RAISE EXCEPTION 'Access denied: You can only access your own verification documents';
  END IF;
  
  RETURN access_granted;
END;
$$;

-- Create function to audit all verification document operations
CREATE OR REPLACE FUNCTION public.audit_verification_operation(
  p_operation TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.log_security_event(
    auth.uid(),
    p_operation,
    p_resource_type,
    p_resource_id,
    true,
    NULL,
    p_metadata || jsonb_build_object('timestamp', now())
  );
END;
$$;

-- Create trigger function to log verification document updates
CREATE OR REPLACE FUNCTION public.log_verification_document_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when verification document URLs are changed
  IF TG_OP = 'UPDATE' AND (
    OLD.id_document_url IS DISTINCT FROM NEW.id_document_url OR
    OLD.license_document_url IS DISTINCT FROM NEW.license_document_url
  ) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'verification_documents_updated',
      'verification_request',
      NEW.id,
      true,
      NULL,
      jsonb_build_object(
        'verification_request_id', NEW.id,
        'user_id', NEW.user_id,
        'changes', jsonb_build_object(
          'id_document_changed', (OLD.id_document_url IS DISTINCT FROM NEW.id_document_url),
          'license_document_changed', (OLD.license_document_url IS DISTINCT FROM NEW.license_document_url),
          'old_id_document_present', (OLD.id_document_url IS NOT NULL),
          'new_id_document_present', (NEW.id_document_url IS NOT NULL),
          'old_license_document_present', (OLD.license_document_url IS NOT NULL),
          'new_license_document_present', (NEW.license_document_url IS NOT NULL)
        ),
        'status', NEW.status,
        'document_status', NEW.document_status
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS verification_document_updates_audit ON public.verification_requests;
CREATE TRIGGER verification_document_updates_audit
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_document_updates();

-- Create function to check document access permissions
CREATE OR REPLACE FUNCTION public.has_verification_document_access(
  p_verification_request_id UUID,
  p_document_type TEXT DEFAULT 'any'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_user_id UUID;
  is_admin_user BOOLEAN;
  has_access BOOLEAN := false;
BEGIN
  -- Get the user_id of the verification request
  SELECT user_id INTO request_user_id
  FROM public.verification_requests
  WHERE id = p_verification_request_id;
  
  IF request_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  is_admin_user := public.is_admin();
  has_access := (auth.uid() = request_user_id OR is_admin_user);
  
  -- Log the access check
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_access_check',
    'verification_request',
    p_verification_request_id,
    has_access,
    CASE WHEN NOT has_access THEN 'Access denied to verification documents' ELSE NULL END,
    jsonb_build_object(
      'document_type', p_document_type,
      'request_user_id', request_user_id,
      'requesting_user_id', auth.uid(),
      'is_admin_access', is_admin_user,
      'access_granted', has_access
    )
  );
  
  RETURN has_access;
END;
$$;

-- Add additional security: Create function to mask sensitive verification data
CREATE OR REPLACE FUNCTION public.mask_verification_data(
  p_data TEXT,
  p_user_id UUID,
  p_field_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only show real data to the owner or admins
  IF public.is_admin() OR auth.uid() = p_user_id THEN
    RETURN p_data;
  ELSE
    -- Return masked data for unauthorized users
    CASE 
      WHEN p_data IS NULL THEN RETURN NULL;
      WHEN p_field_name LIKE '%_url' THEN RETURN '[DOCUMENT PRESENT - ACCESS RESTRICTED]';
      WHEN p_field_name LIKE '%_number' THEN RETURN '[REDACTED]';
      ELSE RETURN '[CONFIDENTIAL]';
    END CASE;
  END IF;
END;
$$;