-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.generate_slug(title_text TEXT, location_text TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  title_slug TEXT;
  city_slug TEXT;
  country_slug TEXT;
  location_parts TEXT[];
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Clean and slugify title
  title_slug := lower(
    regexp_replace(
      regexp_replace(title_text, '[^a-zA-Z0-9\s\-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  title_slug := trim(both '-' from title_slug);
  
  -- If no location provided, use title only
  IF location_text IS NULL OR location_text = '' THEN
    base_slug := COALESCE(NULLIF(title_slug, ''), 'guide');
  ELSE
    -- Parse location to extract city and country
    -- Split by comma and clean up
    location_parts := string_to_array(location_text, ',');
    
    IF array_length(location_parts, 1) >= 2 THEN
      -- Extract city (first part) and country (last part)
      city_slug := lower(
        regexp_replace(
          regexp_replace(trim(location_parts[1]), '[^a-zA-Z0-9\s\-]', '', 'g'),
          '\s+', '-', 'g'
        )
      );
      country_slug := lower(
        regexp_replace(
          regexp_replace(trim(location_parts[array_length(location_parts, 1)]), '[^a-zA-Z0-9\s\-]', '', 'g'),
          '\s+', '-', 'g'
        )
      );
    ELSIF array_length(location_parts, 1) = 1 THEN
      -- Only one location part, use it as country
      country_slug := lower(
        regexp_replace(
          regexp_replace(trim(location_parts[1]), '[^a-zA-Z0-9\s\-]', '', 'g'),
          '\s+', '-', 'g'
        )
      );
      city_slug := '';
    ELSE
      city_slug := '';
      country_slug := '';
    END IF;
    
    -- Clean up slugs
    city_slug := trim(both '-' from city_slug);
    country_slug := trim(both '-' from country_slug);
    
    -- Build the final slug: title-city-country
    base_slug := title_slug;
    IF city_slug != '' THEN
      base_slug := base_slug || '-' || city_slug;
    END IF;
    IF country_slug != '' THEN
      base_slug := base_slug || '-' || country_slug;
    END IF;
  END IF;
  
  -- Ensure slug is not empty
  IF base_slug = '' OR base_slug IS NULL THEN
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

-- Fix auto_generate_slug function security
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Generate slug if not provided or if title/location changed
  IF NEW.slug IS NULL OR (
    (OLD.title IS DISTINCT FROM NEW.title OR OLD.location IS DISTINCT FROM NEW.location) 
    AND NEW.slug = OLD.slug
  ) THEN
    NEW.slug := public.generate_slug(NEW.title, NEW.location);
  END IF;
  RETURN NEW;
END;
$$;