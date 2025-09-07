-- Add foreign key relationship between audio_guides.creator_id and profiles.user_id
-- This will enable the Supabase ! join syntax to work properly
ALTER TABLE public.audio_guides 
ADD CONSTRAINT fk_audio_guides_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;