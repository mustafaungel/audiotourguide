-- Create storage buckets for guide content
INSERT INTO storage.buckets (id, name, public) VALUES ('guide-images', 'guide-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('guide-audio', 'guide-audio', false);

-- Create policies for guide images (public read access)
CREATE POLICY "Anyone can view guide images" ON storage.objects 
FOR SELECT USING (bucket_id = 'guide-images');

CREATE POLICY "Authenticated users can upload guide images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'guide-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own guide images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'guide-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for guide audio (authenticated access only)
CREATE POLICY "Authenticated users can view guide audio" ON storage.objects 
FOR SELECT USING (bucket_id = 'guide-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload guide audio" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'guide-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own guide audio" ON storage.objects 
FOR UPDATE USING (bucket_id = 'guide-audio' AND auth.uid()::text = (storage.foldername(name))[1]);