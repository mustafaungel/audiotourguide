-- Phase 3: Clean up duplicate and legacy storage policies

-- guide-audio: Remove 3 duplicate SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view guide audio" ON storage.objects;
DROP POLICY IF EXISTS "Guide audio files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- guide-audio: Remove legacy DELETE policy (uses owner column)
DROP POLICY IF EXISTS "Users can delete their own guide audio" ON storage.objects;

-- guide-audio: Remove legacy UPDATE policies
DROP POLICY IF EXISTS "Users can update their own guide audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates for authenticated users" ON storage.objects;

-- guide-images: Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Anyone can view guide images" ON storage.objects;

-- guide-images: Remove legacy UPDATE policy (uses folder path check)
DROP POLICY IF EXISTS "Users can update their own guide images" ON storage.objects;