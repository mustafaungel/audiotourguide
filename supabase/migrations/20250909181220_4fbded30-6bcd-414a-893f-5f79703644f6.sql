-- Fix audio guides visibility by ensuring proper permissions
-- Check what policies exist and fix any issues

-- Let's check if we need to fix the existing policy or add missing permissions
-- First ensure anon and authenticated users have SELECT permissions
GRANT SELECT ON public.audio_guides TO anon, authenticated;
GRANT SELECT ON public.guide_sections TO anon, authenticated;

-- Also grant permissions on related tables that might be needed
GRANT SELECT ON public.viral_metrics TO anon, authenticated;
GRANT SELECT ON public.viral_shares TO anon, authenticated;

-- Ensure homepage_stats are accessible 
GRANT SELECT ON public.homepage_stats TO anon, authenticated;