-- Add image_urls column to audio_guides for multiple images (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audio_guides' 
        AND column_name = 'image_urls' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.audio_guides 
        ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;