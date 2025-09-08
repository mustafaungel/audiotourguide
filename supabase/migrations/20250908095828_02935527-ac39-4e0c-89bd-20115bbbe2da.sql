-- Add DELETE policy for admins on audio_guides table
CREATE POLICY "Admins can delete all guides" 
ON public.audio_guides 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));