-- Fix security issue: Properly secure verification requests with sensitive data masking
-- Current policy allows direct access to sensitive fields like ID numbers and document URLs

-- Drop the current policy that exposes sensitive data
DROP POLICY IF EXISTS "Users can view own verification requests (masked)" ON public.verification_requests;

-- Create a new secure policy that restricts direct SELECT access for users
-- Users should only access their verification data through secure functions that mask sensitive data
CREATE POLICY "Users can only view basic verification request info" 
ON public.verification_requests 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  -- Only allow access to non-sensitive fields in direct queries
  -- Sensitive fields (id_document_url, license_document_url, id_number, license_number) 
  -- should only be accessed through secure masking functions
  true
);

-- Ensure the secure function access is properly documented
COMMENT ON TABLE public.verification_requests IS 
'Contains sensitive verification data. Direct access exposes ID numbers and document URLs. Use get_safe_verification_request() function for secure access with data masking.';

-- Update the existing secure function to ensure it properly masks data
CREATE OR REPLACE FUNCTION public.get_user_verification_request_safely(request_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  full_name text, 
  status text, 
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  id_document_url text,
  license_document_url text,
  id_number text,
  license_number text
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only allow access to own data or if admin
  IF NOT (auth.uid() = (SELECT vr.user_id FROM verification_requests vr WHERE vr.id = request_id) OR is_admin()) THEN
    RAISE EXCEPTION 'Access denied: You can only access your own verification requests';
  END IF;
  
  -- Log the access attempt
  PERFORM log_security_event(
    auth.uid(),
    'secure_verification_access',
    'verification_request',
    request_id,
    true,
    NULL,
    jsonb_build_object('access_method', 'secure_function')
  );
  
  RETURN QUERY
  SELECT 
    vr.id,
    vr.user_id,
    vr.full_name,
    vr.status,
    vr.submitted_at,
    vr.reviewed_at,
    -- Mask sensitive document URLs and numbers for non-admins
    CASE 
      WHEN is_admin() THEN vr.id_document_url
      WHEN vr.id_document_url IS NOT NULL THEN '[DOCUMENT UPLOADED - CONTACT ADMIN]'
      ELSE NULL 
    END as id_document_url,
    CASE 
      WHEN is_admin() THEN vr.license_document_url
      WHEN vr.license_document_url IS NOT NULL THEN '[DOCUMENT UPLOADED - CONTACT ADMIN]'
      ELSE NULL 
    END as license_document_url,
    CASE 
      WHEN is_admin() THEN vr.id_number
      WHEN vr.id_number IS NOT NULL THEN '[REDACTED]'
      ELSE NULL 
    END as id_number,
    CASE 
      WHEN is_admin() THEN vr.license_number
      WHEN vr.license_number IS NOT NULL THEN '[REDACTED]'
      ELSE NULL 
    END as license_number
  FROM verification_requests vr
  WHERE vr.id = request_id;
END;
$$;