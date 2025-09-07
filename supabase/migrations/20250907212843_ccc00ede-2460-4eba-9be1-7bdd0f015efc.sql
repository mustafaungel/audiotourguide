-- Clean up all problematic QR codes and share URLs
-- Step 1: Remove all QR codes with base64 encoding (they cause scan errors)
UPDATE audio_guides 
SET qr_code_url = NULL
WHERE qr_code_url LIKE '%data=aHR0%' OR qr_code_url LIKE '%data=aHR0cHM%';

-- Step 2: Clear all existing share URLs (they point to wrong domain)
UPDATE audio_guides 
SET share_url = NULL
WHERE share_url IS NOT NULL;

-- Step 3: Clear remaining QR codes that point to wrong domains
UPDATE audio_guides 
SET qr_code_url = NULL
WHERE qr_code_url LIKE '%dsaqlgxajdnwoqvtsrqd.supabase.co%' 
   OR qr_code_url LIKE '%lovable.dev%';

-- Add a comment for tracking
COMMENT ON TABLE audio_guides IS 'QR codes and share URLs cleaned up - ready for regeneration with correct domain';