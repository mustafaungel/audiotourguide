-- Critical security fix: Secure contact submissions
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;

CREATE POLICY "Public can create contact submissions" 
ON public.contact_submissions 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Users can view own contact submissions" 
ON public.contact_submissions 
FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
);