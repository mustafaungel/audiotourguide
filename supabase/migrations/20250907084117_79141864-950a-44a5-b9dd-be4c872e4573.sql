-- Create enums first
DO $$ BEGIN
    CREATE TYPE creator_type AS ENUM ('local_guide', 'influencer', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM ('basic', 'premium', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to verification_requests table
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS creator_type creator_type DEFAULT 'local_guide',
ADD COLUMN IF NOT EXISTS verification_level verification_level DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS document_status document_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS license_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS social_verification_data JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_creator_type ON public.verification_requests(creator_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_document_status ON public.verification_requests(document_status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_verification_level ON public.verification_requests(verification_level);

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents', 'verification-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for verification documents bucket
CREATE POLICY "Users can upload their own verification documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update profiles table to support enhanced verification badges
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_badge_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS blue_tick_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS local_guide_verified BOOLEAN DEFAULT false;