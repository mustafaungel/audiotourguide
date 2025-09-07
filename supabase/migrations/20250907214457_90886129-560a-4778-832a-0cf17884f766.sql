-- Create placeholder profiles for orphaned creator_ids to fix foreign key constraint
INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
SELECT 
  creator_id,
  'creator-' || creator_id || '@placeholder.com',
  'Content Creator',
  'content_creator'::user_role,
  now(),
  now()
FROM (
  SELECT DISTINCT creator_id 
  FROM audio_guides 
  WHERE creator_id NOT IN (SELECT user_id FROM profiles)
) orphaned_creators;

-- Now add the foreign key constraint
ALTER TABLE public.audio_guides 
ADD CONSTRAINT fk_audio_guides_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;