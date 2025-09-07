-- Create storage bucket for audio guides if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guide-audio', 'guide-audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies for guide-audio bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'guide-audio');

CREATE POLICY "Allow uploads for authenticated users"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'guide-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Allow updates for authenticated users"
ON storage.objects FOR UPDATE
USING (bucket_id = 'guide-audio' AND auth.role() = 'authenticated');