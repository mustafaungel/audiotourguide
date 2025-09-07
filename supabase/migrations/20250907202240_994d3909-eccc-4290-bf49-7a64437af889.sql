-- Add QR code and share URL columns to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS share_url TEXT;