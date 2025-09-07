-- Add sections support to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN sections jsonb DEFAULT '[]'::jsonb;

-- Create guide_sections table for detailed section management
CREATE TABLE public.guide_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  audio_url text,
  duration_seconds integer,
  language text NOT NULL DEFAULT 'English',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on guide_sections
ALTER TABLE public.guide_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for guide_sections
CREATE POLICY "Creators can manage sections of their own guides"
ON public.guide_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.audio_guides 
    WHERE id = guide_sections.guide_id 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all guide sections"
ON public.guide_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view sections of published guides"
ON public.guide_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audio_guides 
    WHERE id = guide_sections.guide_id 
    AND is_published = true 
    AND is_approved = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_guide_sections_updated_at
  BEFORE UPDATE ON public.guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();