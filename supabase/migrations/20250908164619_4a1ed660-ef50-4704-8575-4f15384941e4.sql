-- Add RLS policies for creators to manage their own guides
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