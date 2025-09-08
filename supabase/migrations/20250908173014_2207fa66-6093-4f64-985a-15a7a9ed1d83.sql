-- Add slug column to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN slug TEXT;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug: lowercase, replace spaces/special chars with hyphens
  base_slug := lower(
    regexp_replace(
      regexp_replace(title_text, '[^a-zA-Z0-9\s\-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'guide';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.audio_guides WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Populate existing guides with slugs
UPDATE public.audio_guides 
SET slug = public.generate_slug(title)
WHERE slug IS NULL;

-- Add unique constraint on slug
ALTER TABLE public.audio_guides 
ADD CONSTRAINT audio_guides_slug_unique UNIQUE (slug);

-- Make slug NOT NULL for future records
ALTER TABLE public.audio_guides 
ALTER COLUMN slug SET NOT NULL;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate slug if not provided or if title changed
  IF NEW.slug IS NULL OR (OLD.title IS DISTINCT FROM NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := public.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT OR UPDATE ON public.audio_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_slug();