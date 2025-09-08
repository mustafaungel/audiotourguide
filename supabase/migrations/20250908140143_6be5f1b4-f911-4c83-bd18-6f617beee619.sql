-- Add new fields for admin (permanent) QR codes to audio_guides table
-- Keep existing qr_code_url and share_url for backward compatibility (user-specific codes)
ALTER TABLE public.audio_guides 
ADD COLUMN admin_qr_code_url text,
ADD COLUMN admin_share_url text;

-- Add comments to clarify the difference between the QR code types
COMMENT ON COLUMN public.audio_guides.admin_qr_code_url IS 'Permanent QR code for admin/marketing use - links to purchase page';
COMMENT ON COLUMN public.audio_guides.admin_share_url IS 'Permanent share URL for admin/marketing use - links to purchase page';
COMMENT ON COLUMN public.audio_guides.qr_code_url IS 'User-specific QR code generated after purchase - links to audio access with access code';
COMMENT ON COLUMN public.audio_guides.share_url IS 'User-specific share URL generated after purchase - links to audio access with access code';