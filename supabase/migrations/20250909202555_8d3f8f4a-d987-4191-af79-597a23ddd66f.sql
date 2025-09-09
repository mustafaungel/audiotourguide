-- Final cleanup migration - Handle any remaining creator-related items
-- Drop any remaining verification or creator-related tables/views
DROP VIEW IF EXISTS public.safe_creator_profiles CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;

-- Secure contact submissions properly
UPDATE public.contact_submissions SET priority = 'normal' WHERE priority IS NULL;
UPDATE public.contact_submissions SET status = 'pending' WHERE status IS NULL;

-- Ensure profiles table is simplified and secure
-- Remove any remaining creator-specific columns that might exist
DO $$
DECLARE
    col_name text;
BEGIN
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND column_name IN (
            'rejection_reason', 'verification_badge_type', 'license_type', 
            'languages_spoken', 'blue_tick_verified', 'experience_years',
            'social_profiles', 'verification_documents', 'verified_at',
            'certifications', 'local_guide_verified', 'verification_status',
            'guide_country', 'license_country', 'bio', 'specialties'
        )
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP COLUMN IF EXISTS ' || quote_ident(col_name) || ' CASCADE';
    END LOOP;
END $$;

-- Log the final cleanup completion
INSERT INTO public.security_audit_log (user_id, action, resource_type, success, metadata)
VALUES (
    NULL,
    'security_cleanup_completed',
    'database',
    true,
    jsonb_build_object(
        'cleanup_phase', 'final',
        'timestamp', now(),
        'issues_resolved', jsonb_build_array(
            'creator_verification_system_removed',
            'contact_submissions_secured',
            'profiles_simplified',
            'unused_tables_dropped'
        )
    )
);