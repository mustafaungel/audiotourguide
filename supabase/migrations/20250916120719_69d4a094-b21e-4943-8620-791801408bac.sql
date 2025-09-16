-- Create guide collections table for linking multiple audio guides
CREATE TABLE public.guide_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  linked_guides JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guide_collections ENABLE ROW LEVEL SECURITY;

-- Create policies for guide collections
CREATE POLICY "Admins can manage all guide collections" 
ON public.guide_collections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Creators can manage their own guide collections" 
ON public.guide_collections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.audio_guides 
  WHERE audio_guides.id = guide_collections.main_guide_id 
  AND audio_guides.creator_id = auth.uid()
));

CREATE POLICY "Public can view collections of published guides" 
ON public.guide_collections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.audio_guides 
  WHERE audio_guides.id = guide_collections.main_guide_id 
  AND audio_guides.is_published = true 
  AND audio_guides.is_approved = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_guide_collections_updated_at
BEFORE UPDATE ON public.guide_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_guide_collections_main_guide_id ON public.guide_collections(main_guide_id);