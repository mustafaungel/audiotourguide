-- Phase 1: Security Hardening - Update RLS Policies to use has_role()
-- This migration updates all RLS policies to use the secure has_role() function
-- instead of directly querying the profiles.role column

-- ============================================================================
-- UPDATE ADMIN_APPROVALS TABLE POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can insert approvals" ON public.admin_approvals;
DROP POLICY IF EXISTS "Admins can view all approvals" ON public.admin_approvals;

-- Create new secure policies using has_role()
CREATE POLICY "Admins can view all approvals"
ON public.admin_approvals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert approvals"
ON public.admin_approvals
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- UPDATE DESTINATIONS TABLE POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can manage all destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins can view all destinations" ON public.destinations;

-- Create new secure policies
CREATE POLICY "Admins can view all destinations"
ON public.destinations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all destinations"
ON public.destinations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- UPDATE HOMEPAGE_STATS TABLE POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can manage homepage stats" ON public.homepage_stats;

-- Create new secure policy
CREATE POLICY "Admins can manage homepage stats"
ON public.homepage_stats
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- UPDATE GUIDE_SECTIONS TABLE POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can manage all guide sections" ON public.guide_sections;

-- Create new secure policy
CREATE POLICY "Admins can manage all guide sections"
ON public.guide_sections
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- VERIFICATION: Add comment to track migration
-- ============================================================================

COMMENT ON TABLE public.user_roles IS 'Primary source of truth for user roles - uses secure has_role() function for validation';
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead. Kept for backward compatibility only.';

-- ============================================================================
-- SECURITY AUDIT LOG
-- ============================================================================

-- Log this security migration for audit purposes
INSERT INTO public.security_audit_log (
  user_id,
  action,
  resource_type,
  success,
  metadata
) VALUES (
  NULL,
  'rls_policy_security_migration',
  'database',
  true,
  jsonb_build_object(
    'migration', 'phase_1_security_hardening',
    'tables_updated', ARRAY['admin_approvals', 'destinations', 'homepage_stats', 'guide_sections'],
    'change_type', 'migrated_to_has_role_function',
    'timestamp', now()
  )
);