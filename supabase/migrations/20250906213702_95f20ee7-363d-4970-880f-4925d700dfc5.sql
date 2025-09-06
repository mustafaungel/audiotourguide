-- Enhanced User System: Add verification and creator features (Part 2)

-- First, update the user_role enum to include content_creator
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'content_creator';

-- Add verification and creator-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS creator_badge boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_profiles jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS rejection_reason text;