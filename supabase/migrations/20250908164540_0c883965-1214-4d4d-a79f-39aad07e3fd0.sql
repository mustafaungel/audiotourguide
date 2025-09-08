-- Add creator_id column to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing guides to have a creator_id (set to first admin user for now)
UPDATE public.audio_guides 
SET creator_id = (
  SELECT p.user_id 
  FROM public.profiles p 
  WHERE p.role = 'admin' 
  LIMIT 1
) 
WHERE creator_id IS NULL;

-- Make creator_id NOT NULL after setting existing records
ALTER TABLE public.audio_guides 
ALTER COLUMN creator_id SET NOT NULL;

-- Add RLS policies for creators
CREATE POLICY "Creators can insert their own guides" 
ON public.audio_guides 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can view their own guides" 
ON public.audio_guides 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own guides" 
ON public.audio_guides 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own guides" 
ON public.audio_guides 
FOR DELETE 
USING (auth.uid() = creator_id);