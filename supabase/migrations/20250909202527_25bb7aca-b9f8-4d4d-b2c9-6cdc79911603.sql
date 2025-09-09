-- Security Cleanup Migration: Remove Unused Creator System
-- This removes creator verification features and secures the system for admin-only guide creation

-- Phase 1: Drop unused creator-related views and tables
DROP VIEW IF EXISTS public.safe_creator_profiles CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;

-- Phase 2: Remove creator-related database functions
DROP FUNCTION IF EXISTS public.get_verification_document_urls(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_verification_request_safely(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.audit_verification_document_access() CASCADE;
DROP FUNCTION IF EXISTS public.get_masked_verification_request(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_creator_verification(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_verification_sensitive_data(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_verification_document_url(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_verification_documents(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_verification_document(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_verification_document_access() CASCADE;
DROP FUNCTION IF EXISTS public.audit_verification_document_changes() CASCADE;
DROP FUNCTION IF EXISTS public.validate_verification_document_access(text) CASCADE;
DROP FUNCTION IF EXISTS public.secure_delete_verification_documents(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_verification_documents(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.secure_verification_document_access(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.audit_verification_operation(text, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.log_verification_document_updates() CASCADE;
DROP FUNCTION IF EXISTS public.has_verification_document_access(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_verification_data(text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_safe_verification_request(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_verification_requests() CASCADE;
DROP FUNCTION IF EXISTS public.update_verification_requests_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.approve_creator_verification(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_tier_points(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_creator_tier(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_creator_ratings() CASCADE;
DROP FUNCTION IF EXISTS public.get_safe_creator_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_profile_access_rate_limit(uuid) CASCADE;

-- Phase 3: Remove any creator-related tables we might have missed
DROP TABLE IF EXISTS public.creator_tiers CASCADE;
DROP TABLE IF EXISTS public.tier_history CASCADE;
DROP TABLE IF EXISTS public.creator_service_ratings CASCADE;
DROP TABLE IF EXISTS public.creator_platform_ratings CASCADE;
DROP TABLE IF EXISTS public.creator_connections CASCADE;
DROP TABLE IF EXISTS public.experience_bookings CASCADE;
DROP TABLE IF EXISTS public.profile_privacy_settings CASCADE;

-- Phase 4: Remove creator-specific columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS verification_badge_type,
DROP COLUMN IF EXISTS license_type,
DROP COLUMN IF EXISTS languages_spoken,
DROP COLUMN IF EXISTS blue_tick_verified,
DROP COLUMN IF EXISTS experience_years,
DROP COLUMN IF EXISTS social_profiles,
DROP COLUMN IF EXISTS verification_documents,
DROP COLUMN IF EXISTS verified_at,
DROP COLUMN IF EXISTS certifications,
DROP COLUMN IF EXISTS local_guide_verified,
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS guide_country,
DROP COLUMN IF EXISTS license_country,
DROP COLUMN IF EXISTS bio,
DROP COLUMN IF EXISTS specialties;

-- Phase 5: Simplify user_role enum to only include admin and user
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Update profiles table role column to use simplified enum
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Phase 6: Secure contact submissions with proper RLS
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Validated public contact submissions" ON public.contact_submissions;

-- Create secure RLS policies for contact submissions
CREATE POLICY "Admins can manage all contact submissions"
ON public.contact_submissions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Validate form data
    length(trim(name)) >= 2 AND length(trim(name)) <= 100 AND
    length(trim(email)) >= 5 AND length(trim(email)) <= 254 AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
    length(trim(subject)) >= 3 AND length(trim(subject)) <= 200 AND
    length(trim(message)) >= 10 AND length(trim(message)) <= 2000 AND
    message !~* '(viagra|casino|loan|crypto|bitcoin|investment|forex)'
);

-- Phase 7: Update profiles RLS policies to be more secure
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile securely" ON public.profiles;

-- Create secure RLS policies for simplified profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own basic profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND
    -- Only allow updating safe fields
    full_name IS NOT NULL AND
    length(trim(full_name)) >= 1 AND
    length(trim(full_name)) <= 100
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);