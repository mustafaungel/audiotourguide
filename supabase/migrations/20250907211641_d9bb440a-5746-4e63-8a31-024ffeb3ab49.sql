-- Clean up existing QR codes and regenerate with proper URLs
-- First, let's see current QR codes that need fixing
UPDATE audio_guides 
SET qr_code_url = CASE 
  WHEN qr_code_url LIKE 'data:image%' THEN 
    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=' || 
    encode(('https://dsaqlgxajdnwoqvtsrqd.supabase.co/guide/' || id::text)::bytea, 'base64')
  ELSE qr_code_url 
END,
share_url = CASE 
  WHEN share_url IS NULL OR share_url = '' THEN 
    'https://dsaqlgxajdnwoqvtsrqd.supabase.co/guide/' || id::text
  WHEN share_url LIKE '%lovable.dev%' THEN 
    'https://dsaqlgxajdnwoqvtsrqd.supabase.co/guide/' || id::text
  ELSE share_url 
END
WHERE qr_code_url LIKE 'data:image%' OR share_url IS NULL OR share_url = '' OR share_url LIKE '%lovable.dev%';