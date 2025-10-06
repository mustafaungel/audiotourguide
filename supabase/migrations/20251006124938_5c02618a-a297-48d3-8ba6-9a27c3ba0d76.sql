-- Phase 2: Update Verification Documents Storage Policies to use has_role()

-- Drop old policies using profiles.role (deprecated approach)
DROP POLICY IF EXISTS "Admins can manage all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own verification documents" ON storage.objects;

-- Drop duplicate upload policy (keeping the one with better naming)
DROP POLICY IF EXISTS "Users can upload their own verification documents" ON storage.objects;

-- Create new policies using has_role() function

-- Admin management policy (all operations)
CREATE POLICY "Admin full access to verification documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'verification-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Combined SELECT policy for users (own documents) and admins (all documents)
CREATE POLICY "Users view own verification documents, admins view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- User DELETE policy (own documents only)
CREATE POLICY "Users delete own verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- User UPDATE policy (own documents only)
CREATE POLICY "Users update own verification documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);