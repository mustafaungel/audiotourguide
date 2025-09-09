-- Fix audio guides visibility for anonymous users
-- Grant SELECT permissions to anon role on core tables
GRANT SELECT ON public.audio_guides TO anon, authenticated;
GRANT SELECT ON public.guide_sections TO anon, authenticated;
GRANT SELECT ON public.viral_metrics TO anon, authenticated;
GRANT SELECT ON public.viral_shares TO anon, authenticated;
GRANT SELECT ON public.homepage_stats TO anon, authenticated;
GRANT SELECT ON public.trending_locations TO anon, authenticated;
GRANT SELECT ON public.destinations TO anon, authenticated;

-- Ensure user_purchases table is accessible for guest purchases
GRANT SELECT ON public.user_purchases TO anon, authenticated;

-- Grant permissions on profiles for public creator profiles
GRANT SELECT ON public.profiles TO anon, authenticated;