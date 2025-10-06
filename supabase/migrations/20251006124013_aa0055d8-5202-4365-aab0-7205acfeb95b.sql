-- ============================================================================
-- PHASE 1: FIX STORAGE UPLOAD RESTRICTIONS
-- ============================================================================
-- This migration restricts storage uploads to creators/admins only,
-- sets file size limits, and maintains public read access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop Old Permissive Upload Policies
-- ----------------------------------------------------------------------------

-- Remove policies that allow ANY authenticated user to upload
DROP POLICY IF EXISTS "Authenticated users can upload guide images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload guide audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

-- ----------------------------------------------------------------------------
-- STEP 2: Create Restrictive Upload Policies (Creators/Admins Only)
-- ----------------------------------------------------------------------------

-- Guide Images: Only creators and admins can upload
CREATE POLICY "Creators and admins can upload guide images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide-images'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Guide Audio: Only creators and admins can upload
CREATE POLICY "Creators and admins can upload guide audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide-audio'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ----------------------------------------------------------------------------
-- STEP 3: Create Management Policies for Creators/Admins
-- ----------------------------------------------------------------------------

-- Creators can update their own guide images
CREATE POLICY "Creators can update own guide images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'guide-images'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'guide-images'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Creators can delete their own guide images
CREATE POLICY "Creators can delete own guide images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guide-images'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Creators can update their own guide audio
CREATE POLICY "Creators can update own guide audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'guide-audio'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'guide-audio'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Creators can delete their own guide audio
CREATE POLICY "Creators can delete own guide audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guide-audio'
  AND (
    public.has_role(auth.uid(), 'content_creator'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ----------------------------------------------------------------------------
-- STEP 4: Maintain Public Read Access (Published Content)
-- ----------------------------------------------------------------------------

-- Public can view guide images (for published guides)
CREATE POLICY "Public can view guide images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guide-images');

-- Public can view guide audio (for purchased guides - access controlled by app)
CREATE POLICY "Public can view guide audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guide-audio');

-- ----------------------------------------------------------------------------
-- STEP 5: Set File Size Limits on Buckets
-- ----------------------------------------------------------------------------

-- Set 10MB limit for guide images
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'guide-images';

-- Set 50MB limit for guide audio files
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'guide-audio';

-- Set 5MB limit for verification documents
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'verification-documents';

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERY (for manual checking after migration)
-- ----------------------------------------------------------------------------
-- Run this to verify policies are correct:
-- SELECT policyname, cmd, qual::text, with_check::text 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
-- AND tablename = 'objects' 
-- AND (policyname LIKE '%guide%' OR policyname LIKE '%verification%')
-- ORDER BY policyname;