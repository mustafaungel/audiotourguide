-- Create function to calculate guide duration from sections
CREATE OR REPLACE FUNCTION public.calculate_guide_duration(p_guide_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_duration integer := 0;
  section_duration integer;
BEGIN
  -- Sum all section durations for this guide, prioritizing English sections
  -- If no English sections exist, use the language with the most sections
  
  -- First try English sections
  SELECT COALESCE(SUM(duration_seconds), 0) INTO total_duration
  FROM guide_sections 
  WHERE guide_id = p_guide_id 
    AND language_code = 'en'
    AND duration_seconds IS NOT NULL;
  
  -- If no English sections with duration, get the language with most sections
  IF total_duration = 0 THEN
    WITH language_counts AS (
      SELECT language_code, COUNT(*) as section_count
      FROM guide_sections 
      WHERE guide_id = p_guide_id
      GROUP BY language_code
      ORDER BY section_count DESC
      LIMIT 1
    )
    SELECT COALESCE(SUM(gs.duration_seconds), 0) INTO total_duration
    FROM guide_sections gs
    JOIN language_counts lc ON gs.language_code = lc.language_code
    WHERE gs.guide_id = p_guide_id 
      AND gs.duration_seconds IS NOT NULL;
  END IF;
  
  -- If still no duration found, estimate from description lengths
  IF total_duration = 0 THEN
    SELECT COALESCE(SUM(
      CASE 
        WHEN description IS NOT NULL THEN
          GREATEST(60, LENGTH(description) / 10) -- Min 1 minute, ~10 chars per second
        ELSE 180 -- Default 3 minutes if no description
      END
    ), 0) INTO total_duration
    FROM guide_sections 
    WHERE guide_id = p_guide_id 
      AND language_code = (
        SELECT language_code 
        FROM guide_sections 
        WHERE guide_id = p_guide_id
        GROUP BY language_code
        ORDER BY COUNT(*) DESC
        LIMIT 1
      );
  END IF;
  
  RETURN GREATEST(total_duration, 60); -- Minimum 1 minute
END;
$function$;

-- Create function to update guide duration when sections change
CREATE OR REPLACE FUNCTION public.update_guide_duration_from_sections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_guide_id uuid;
  new_duration integer;
BEGIN
  -- Get guide_id from the affected row
  target_guide_id := COALESCE(NEW.guide_id, OLD.guide_id);
  
  -- Calculate new duration
  new_duration := public.calculate_guide_duration(target_guide_id);
  
  -- Update the guide duration
  UPDATE public.audio_guides 
  SET 
    duration = new_duration,
    updated_at = now()
  WHERE id = target_guide_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger on guide_sections table
DROP TRIGGER IF EXISTS trigger_update_guide_duration ON public.guide_sections;
CREATE TRIGGER trigger_update_guide_duration
  AFTER INSERT OR UPDATE OR DELETE ON public.guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guide_duration_from_sections();

-- Backfill existing guides with calculated durations
UPDATE public.audio_guides 
SET duration = public.calculate_guide_duration(id)
WHERE id IN (
  SELECT DISTINCT guide_id 
  FROM public.guide_sections
);