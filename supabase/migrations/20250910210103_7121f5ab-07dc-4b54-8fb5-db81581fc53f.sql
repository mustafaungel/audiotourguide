-- Add language support to guide_sections table
ALTER TABLE public.guide_sections 
ADD COLUMN language_code TEXT NOT NULL DEFAULT 'en',
ADD COLUMN original_section_id UUID REFERENCES public.guide_sections(id),
ADD COLUMN is_original BOOLEAN NOT NULL DEFAULT true;

-- Create index for better performance on language queries
CREATE INDEX idx_guide_sections_language ON public.guide_sections(guide_id, language_code);
CREATE INDEX idx_guide_sections_original ON public.guide_sections(original_section_id);

-- Create table for supported languages
CREATE TABLE public.supported_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default languages
INSERT INTO public.supported_languages (code, name, native_name) VALUES
('en', 'English', 'English'),
('tr', 'Turkish', 'Türkçe'),
('es', 'Spanish', 'Español'),
('fr', 'French', 'Français'),
('de', 'German', 'Deutsch'),
('it', 'Italian', 'Italiano'),
('pt', 'Portuguese', 'Português'),
('ja', 'Japanese', '日本語'),
('ko', 'Korean', '한국어'),
('zh', 'Chinese', '中文');

-- Enable RLS for supported_languages
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

-- RLS policies for supported_languages
CREATE POLICY "Anyone can view supported languages" 
ON public.supported_languages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage supported languages" 
ON public.supported_languages 
FOR ALL 
USING (is_admin());

-- Update existing guide_sections to mark them as original English versions
UPDATE public.guide_sections 
SET language_code = 'en', is_original = true 
WHERE language_code = 'English' OR language_code IS NULL;

-- Add function to get guide languages
CREATE OR REPLACE FUNCTION public.get_guide_languages(p_guide_id UUID)
RETURNS TABLE(language_code TEXT, language_name TEXT, native_name TEXT, section_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.code,
    sl.name,
    sl.native_name,
    COUNT(gs.id)::INTEGER as section_count
  FROM public.supported_languages sl
  LEFT JOIN public.guide_sections gs ON gs.language_code = sl.code AND gs.guide_id = p_guide_id
  WHERE sl.is_active = true
  GROUP BY sl.code, sl.name, sl.native_name
  HAVING COUNT(gs.id) > 0
  ORDER BY sl.code;
END;
$$;