-- Add master_access_code column to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN master_access_code TEXT;

-- Generate master access codes for existing published guides
UPDATE public.audio_guides 
SET master_access_code = public.generate_access_code()
WHERE is_published = true AND master_access_code IS NULL;

-- Update QR codes for existing guides to use master access codes
UPDATE public.audio_guides 
SET 
  qr_code_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=' || 
    'https%3A%2F%2Faudiotourguide.app%2Faccess%2F' || id::text || '%3Faccess_code%3D' || master_access_code,
  share_url = 'https://audiotourguide.app/access/' || id::text || '?access_code=' || master_access_code
WHERE is_published = true AND master_access_code IS NOT NULL;