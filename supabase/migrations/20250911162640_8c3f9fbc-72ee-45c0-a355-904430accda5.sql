-- Ensure guide-audio bucket has proper RLS policies for regional access
-- Update storage policies for better access control

-- Policy for reading guide audio files publicly
CREATE POLICY IF NOT EXISTS "Guide audio files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'guide-audio');

-- Policy for uploading guide audio files by authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can upload guide audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'guide-audio' 
  AND auth.uid() IS NOT NULL
);

-- Policy for updating guide audio files by their owners
CREATE POLICY IF NOT EXISTS "Users can update their own guide audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'guide-audio' 
  AND auth.uid() = owner
);

-- Policy for deleting guide audio files by their owners or admins
CREATE POLICY IF NOT EXISTS "Users can delete their own guide audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'guide-audio' 
  AND (auth.uid() = owner OR is_admin())
);