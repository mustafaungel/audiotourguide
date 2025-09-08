-- Add foreign key constraint to properly link audio_guides and profiles
ALTER TABLE audio_guides 
ADD CONSTRAINT fk_audio_guides_creator 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;