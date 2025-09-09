-- Add is_featured column to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create index for better performance when filtering featured guides
CREATE INDEX idx_audio_guides_featured ON public.audio_guides(is_featured) WHERE is_featured = true;