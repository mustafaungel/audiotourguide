-- Add maps_url column
ALTER TABLE public.guide_sections ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Sync function: when maps_url is updated on any language version of a section,
-- propagate it to the original and all its translations
CREATE OR REPLACE FUNCTION public.sync_section_maps_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original_id UUID;
BEGIN
  -- Avoid recursion: only run on outermost trigger call
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Only act if maps_url actually changed
  IF NEW.maps_url IS DISTINCT FROM OLD.maps_url THEN
    -- Determine the "anchor" original section id
    IF NEW.is_original THEN
      v_original_id := NEW.id;
    ELSE
      v_original_id := NEW.original_section_id;
    END IF;

    IF v_original_id IS NOT NULL THEN
      -- Update the original row (if we're a translation)
      UPDATE public.guide_sections
        SET maps_url = NEW.maps_url
        WHERE id = v_original_id
          AND id <> NEW.id
          AND maps_url IS DISTINCT FROM NEW.maps_url;

      -- Update all sibling translations
      UPDATE public.guide_sections
        SET maps_url = NEW.maps_url
        WHERE original_section_id = v_original_id
          AND id <> NEW.id
          AND maps_url IS DISTINCT FROM NEW.maps_url;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_section_maps_url_trigger ON public.guide_sections;

CREATE TRIGGER sync_section_maps_url_trigger
AFTER UPDATE OF maps_url ON public.guide_sections
FOR EACH ROW
EXECUTE FUNCTION public.sync_section_maps_url();