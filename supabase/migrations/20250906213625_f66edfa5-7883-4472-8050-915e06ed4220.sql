-- Enhanced User System: Add verification and creator features

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

-- Create verification requests table for tracking verification process
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  full_name text NOT NULL,
  id_document_url text,
  portfolio_url text,
  experience_description text,
  social_media_links jsonb DEFAULT '{}',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(user_id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own verification requests
CREATE POLICY "Users can insert their own verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Admins can update all verification requests
CREATE POLICY "Admins can update all verification requests" 
ON public.verification_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create function to handle verification approval
CREATE OR REPLACE FUNCTION public.approve_creator_verification(
  request_id uuid,
  admin_notes_param text DEFAULT NULL
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve verification requests';
  END IF;
  
  -- Get the user_id from the request
  SELECT user_id INTO request_user_id 
  FROM public.verification_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF request_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
  
  -- Update the verification request
  UPDATE public.verification_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update the user profile
  UPDATE public.profiles 
  SET 
    role = 'content_creator',
    verification_status = 'verified',
    verified_at = now(),
    creator_badge = true,
    updated_at = now()
  WHERE user_id = request_user_id;
  
  RETURN true;
END;
$$;

-- Create function to handle verification rejection
CREATE OR REPLACE FUNCTION public.reject_creator_verification(
  request_id uuid,
  rejection_reason_param text,
  admin_notes_param text DEFAULT NULL
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject verification requests';
  END IF;
  
  -- Get the user_id from the request
  SELECT user_id INTO request_user_id 
  FROM public.verification_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF request_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
  
  -- Update the verification request
  UPDATE public.verification_requests 
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update the user profile
  UPDATE public.profiles 
  SET 
    verification_status = 'rejected',
    rejection_reason = rejection_reason_param,
    updated_at = now()
  WHERE user_id = request_user_id;
  
  RETURN true;
END;
$$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_verification_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_verification_requests_updated_at();