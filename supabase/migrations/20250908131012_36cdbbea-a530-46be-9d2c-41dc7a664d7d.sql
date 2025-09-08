-- Fix the security definer view issue
-- Remove the security barrier from the view and use a different approach

-- Drop the problematic view
DROP VIEW IF EXISTS public.secure_verification_requests;

-- Create a regular view without security definer properties
CREATE VIEW public.verification_requests_safe AS
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
  -- Conditionally show document presence (not actual URLs)
  CASE 
    WHEN id_document_url IS NOT NULL THEN true
    ELSE false
  END as has_id_document,
  CASE 
    WHEN license_document_url IS NOT NULL THEN true
    ELSE false
  END as has_license_document
FROM public.verification_requests;

-- Grant access to the view
GRANT SELECT ON public.verification_requests_safe TO authenticated;

-- Create a separate function for authorized document URL access
CREATE OR REPLACE FUNCTION public.get_verification_document_urls(p_request_id UUID)
RETURNS TABLE (
  id_document_url TEXT,
  license_document_url TEXT,
  id_number TEXT,
  license_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_user_id UUID;
  is_authorized BOOLEAN := false;
BEGIN
  -- Get the user_id for this verification request
  SELECT user_id INTO request_user_id
  FROM public.verification_requests
  WHERE id = p_request_id;
  
  -- Check authorization: user owns the request or is admin
  is_authorized := (auth.uid() = request_user_id OR public.is_admin());
  
  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Access denied: You can only access your own verification documents';
  END IF;
  
  -- Log the access for audit trail
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_url_access',
    'verification_request',
    p_request_id,
    true,
    NULL,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_owner', request_user_id,
      'is_admin_access', public.is_admin()
    )
  );
  
  -- Return the document URLs only if authorized
  RETURN QUERY
  SELECT 
    vr.id_document_url,
    vr.license_document_url,
    vr.id_number,
    vr.license_number
  FROM public.verification_requests vr
  WHERE vr.id = p_request_id;
END;
$$;