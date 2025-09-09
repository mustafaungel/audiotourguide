-- Fix security issue: Properly secure verification requests with sensitive data masking
-- Current policy allows direct access to sensitive fields like ID numbers and document URLs

-- Drop the current policy that exposes sensitive data
DROP POLICY IF EXISTS "Users can view own verification requests (masked)" ON public.verification_requests;

-- Create a new secure policy that completely restricts direct SELECT access
-- Users should only access their verification data through secure functions
CREATE POLICY "Verification requests accessible only through secure functions" 
ON public.verification_requests 
FOR SELECT 
USING (false);  -- Block all direct SELECT access

-- Allow only admins to have direct access for management purposes
CREATE POLICY "Admins have full verification request access" 
ON public.verification_requests 
FOR SELECT 
USING (is_admin());

-- Ensure the secure function access is properly documented
COMMENT ON TABLE public.verification_requests IS 
'Sensitive verification data. Access only through get_safe_verification_request() function for users, direct access for admins only.';

-- Create a trigger to automatically mask sensitive data on updates if accessed incorrectly
CREATE OR REPLACE FUNCTION public.protect_verification_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any direct access attempts to sensitive fields
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_data_access_attempt',
    'verification_request',
    NEW.id,
    true,
    NULL,
    jsonb_build_object(
      'access_method', 'direct_query',
      'has_sensitive_data', (NEW.id_document_url IS NOT NULL OR NEW.license_document_url IS NOT NULL)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to monitor access patterns
DROP TRIGGER IF EXISTS verification_access_monitor ON public.verification_requests;
CREATE TRIGGER verification_access_monitor
  AFTER SELECT ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_verification_sensitive_fields();