-- Fix the security definer view warning by using proper RLS policies instead

-- Drop the problematic view with security definer
DROP VIEW IF EXISTS public.safe_verification_requests;

-- Remove the problematic policy
DROP POLICY IF EXISTS "Safe verification requests access" ON public.verification_requests;

-- Instead, create a function that returns filtered data without security definer view
CREATE OR REPLACE FUNCTION public.get_safe_verification_request(request_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  creator_type TEXT,
  verification_level TEXT,
  status TEXT,
  document_status TEXT,
  experience_description TEXT,
  portfolio_url TEXT,
  social_media_links JSONB,
  social_verification_data JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  id_document_url TEXT,
  license_document_url TEXT,
  id_number TEXT,
  license_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Security check: Only allow access to own documents or if admin
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.verification_requests vr 
    WHERE vr.id = request_id AND vr.user_id = auth.uid()
  )) THEN
    RAISE EXCEPTION 'Access denied: You can only access your own verification requests';
  END IF;

  RETURN QUERY
  SELECT 
    vr.id,
    vr.user_id,
    vr.full_name,
    vr.creator_type::TEXT,
    vr.verification_level::TEXT,
    vr.status,
    vr.document_status::TEXT,
    vr.experience_description,
    vr.portfolio_url,
    vr.social_media_links,
    vr.social_verification_data,
    vr.submitted_at,
    vr.reviewed_at,
    vr.reviewed_by,
    vr.admin_notes,
    vr.created_at,
    vr.updated_at,
    -- Only include sensitive document info for admins or document owners
    CASE 
      WHEN public.is_admin() OR auth.uid() = vr.user_id THEN vr.id_document_url
      ELSE NULL 
    END as id_document_url,
    CASE 
      WHEN public.is_admin() OR auth.uid() = vr.user_id THEN vr.license_document_url
      ELSE NULL 
    END as license_document_url,
    CASE 
      WHEN public.is_admin() OR auth.uid() = vr.user_id THEN vr.id_number
      ELSE NULL 
    END as id_number,
    CASE 
      WHEN public.is_admin() OR auth.uid() = vr.user_id THEN vr.license_number
      ELSE NULL 
    END as license_number
  FROM public.verification_requests vr
  WHERE vr.id = request_id;
END;
$$;

-- Ensure proper RLS policies are in place for verification_requests
-- The existing policies should be sufficient, but let's make sure they're comprehensive

-- Ensure users can only see their own verification requests
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure admins can view all verification requests  
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Create a secure wrapper function for admins to get all verification requests
CREATE OR REPLACE FUNCTION public.admin_get_verification_requests()
RETURNS SETOF public.verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log admin access
  PERFORM public.log_security_event(
    auth.uid(),
    'admin_verification_requests_access',
    'verification_request',
    NULL,
    true,
    NULL,
    jsonb_build_object('admin_id', auth.uid())
  );
  
  RETURN QUERY SELECT * FROM public.verification_requests;
END;
$$;