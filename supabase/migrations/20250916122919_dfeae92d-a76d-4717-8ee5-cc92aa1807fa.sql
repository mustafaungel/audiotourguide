-- Add UNIQUE constraint on main_guide_id for guide_collections to enable upsert
ALTER TABLE public.guide_collections 
ADD CONSTRAINT guide_collections_main_guide_id_unique UNIQUE (main_guide_id);

-- Drop existing policies and create new explicit ones for guide_collections
DROP POLICY IF EXISTS "Admins can manage all guide collections" ON public.guide_collections;
DROP POLICY IF EXISTS "Creators can manage their own guide collections" ON public.guide_collections;  
DROP POLICY IF EXISTS "Public can view collections of published guides" ON public.guide_collections;

-- Create explicit RLS policies for guide_collections
CREATE POLICY "Admins can insert guide collections" 
ON public.guide_collections 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update guide collections" 
ON public.guide_collections 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can select guide collections" 
ON public.guide_collections 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Creators can insert their own guide collections" 
ON public.guide_collections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM audio_guides 
  WHERE id = main_guide_id AND creator_id = auth.uid()
));

CREATE POLICY "Creators can update their own guide collections" 
ON public.guide_collections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM audio_guides 
  WHERE id = main_guide_id AND creator_id = auth.uid()
));

CREATE POLICY "Creators can select their own guide collections" 
ON public.guide_collections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM audio_guides 
  WHERE id = main_guide_id AND creator_id = auth.uid()
));

CREATE POLICY "Public can view collections of published guides" 
ON public.guide_collections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM audio_guides 
  WHERE id = main_guide_id 
  AND is_published = true 
  AND is_approved = true
));