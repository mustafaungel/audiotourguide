-- Find and fix any remaining security definer views
-- Check for views with security_barrier property

-- List all views to identify any with security properties
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND (definition LIKE '%SECURITY%' OR definition LIKE '%security_barrier%');

-- The linter might be detecting a view we haven't identified
-- Let's check for any views with security_barrier set to true
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN viewowner IS NOT NULL THEN 'Has special owner'
    ELSE 'Normal view'
  END as view_type
FROM pg_views 
WHERE schemaname = 'public';

-- Check for any security definer functions that might be mistaken for views
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND security_type = 'DEFINER';

-- Remove any problematic view properties
-- The issue might be that we need to explicitly set security_barrier to false
ALTER VIEW IF EXISTS public.verification_requests_safe SET (security_barrier = false);