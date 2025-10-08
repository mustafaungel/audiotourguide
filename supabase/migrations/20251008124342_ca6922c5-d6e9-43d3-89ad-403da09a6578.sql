-- Fix language_code for Cappadocia Red Tour sections
UPDATE guide_sections
SET language_code = 'zh'
WHERE guide_id = 'befc6807-0d9a-4030-a2cf-051b4782e412' 
  AND language = 'Chinese' 
  AND language_code <> 'zh';

-- Update audio_guides languages array to include Chinese
UPDATE audio_guides
SET languages = ARRAY['Chinese']
WHERE id = 'befc6807-0d9a-4030-a2cf-051b4782e412';

-- Add trigger to automatically sync language and language_code
CREATE OR REPLACE FUNCTION sync_section_language_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-sync language_code from supported_languages when language is set
  IF NEW.language IS NOT NULL THEN
    SELECT code INTO NEW.language_code
    FROM supported_languages
    WHERE name = NEW.language AND is_active = true
    LIMIT 1;
    
    -- If no match found, keep the provided language_code or default to 'en'
    IF NEW.language_code IS NULL THEN
      NEW.language_code := COALESCE(NEW.language_code, 'en');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_language_code_sync
  BEFORE INSERT OR UPDATE ON guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION sync_section_language_code();