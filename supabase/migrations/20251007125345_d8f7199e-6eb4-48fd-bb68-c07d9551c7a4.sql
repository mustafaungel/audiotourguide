-- Add is_standalone column to audio_guides table
-- This controls whether a guide appears in main listings or only through collections
ALTER TABLE audio_guides 
ADD COLUMN is_standalone boolean NOT NULL DEFAULT true;

-- Create index for better query performance on standalone guides
CREATE INDEX idx_audio_guides_standalone 
ON audio_guides(is_standalone) 
WHERE is_standalone = true;

-- Add helpful comment for documentation
COMMENT ON COLUMN audio_guides.is_standalone IS 
'If true, guide appears in main listings. If false, only accessible through collections';