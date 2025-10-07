-- Phase 2: Performance Optimization - Database Indexes and Materialized View
-- This migration adds critical indexes to speed up admin panel queries
-- and creates a materialized view for analytics calculations

-- ============================================================================
-- CREATE INDEXES FOR IMPROVED QUERY PERFORMANCE
-- ============================================================================

-- Speed up guide queries by creator and publication status
CREATE INDEX IF NOT EXISTS idx_guides_creator_published 
ON public.audio_guides(creator_id, is_published, created_at DESC);

-- Speed up guide queries by approval and publication status  
CREATE INDEX IF NOT EXISTS idx_guides_approved_published 
ON public.audio_guides(is_approved, is_published, created_at DESC);

-- Speed up review queries by status
CREATE INDEX IF NOT EXISTS idx_reviews_status 
ON public.guest_reviews(status, created_at DESC);

-- Speed up review queries by guide
CREATE INDEX IF NOT EXISTS idx_reviews_guide 
ON public.guest_reviews(guide_id, is_approved);

-- Speed up purchase queries by guide
CREATE INDEX IF NOT EXISTS idx_purchases_guide 
ON public.user_purchases(guide_id, purchase_date DESC);

-- Speed up destination queries
CREATE INDEX IF NOT EXISTS idx_destinations_approved 
ON public.destinations(is_approved, created_at DESC);

-- Speed up viral metrics queries
CREATE INDEX IF NOT EXISTS idx_viral_metrics_guide_date 
ON public.viral_metrics(guide_id, date DESC);

-- ============================================================================
-- CREATE MATERIALIZED VIEW FOR ANALYTICS
-- ============================================================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.guide_analytics_summary;

-- Create materialized view for pre-calculated analytics
CREATE MATERIALIZED VIEW public.guide_analytics_summary AS
SELECT 
  ag.id as guide_id,
  ag.title,
  ag.location,
  ag.category,
  ag.is_published,
  ag.is_approved,
  ag.created_at,
  
  -- Purchase metrics
  COUNT(DISTINCT up.id) as total_purchases,
  COALESCE(SUM(up.price_paid), 0) as total_revenue,
  
  -- Review metrics
  COUNT(DISTINCT gr.id) as total_reviews,
  COALESCE(AVG(gr.rating), 0) as avg_rating,
  
  -- Viral metrics
  COALESCE(SUM(vm.views_count), 0) as total_views,
  COALESCE(SUM(vm.shares_count), 0) as total_shares,
  COALESCE(MAX(vm.viral_score), 0) as max_viral_score,
  
  -- Calculated metrics
  CASE 
    WHEN COUNT(DISTINCT up.id) > 0 AND COALESCE(SUM(vm.views_count), 0) > 0 
    THEN (COUNT(DISTINCT up.id)::numeric / NULLIF(SUM(vm.views_count), 0)) * 100
    ELSE 0
  END as conversion_rate
  
FROM public.audio_guides ag
LEFT JOIN public.user_purchases up ON up.guide_id = ag.id
LEFT JOIN public.guest_reviews gr ON gr.guide_id = ag.id AND gr.status = 'approved'
LEFT JOIN public.viral_metrics vm ON vm.guide_id = ag.id
GROUP BY ag.id, ag.title, ag.location, ag.category, ag.is_published, ag.is_approved, ag.created_at;

-- Create unique index on guide_id for faster lookups
CREATE UNIQUE INDEX idx_analytics_summary_guide 
ON public.guide_analytics_summary(guide_id);

-- ============================================================================
-- CREATE FUNCTION TO REFRESH MATERIALIZED VIEW
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_analytics_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.guide_analytics_summary;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_analytics_summary() TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW public.guide_analytics_summary IS 
'Pre-calculated analytics for admin dashboard. Refresh every 5-15 minutes for optimal performance.';

COMMENT ON INDEX idx_guides_creator_published IS 
'Optimizes queries for guides by creator and publication status';

COMMENT ON INDEX idx_reviews_status IS 
'Optimizes review moderation queries by status';

COMMENT ON INDEX idx_purchases_guide IS 
'Optimizes purchase history queries by guide';
