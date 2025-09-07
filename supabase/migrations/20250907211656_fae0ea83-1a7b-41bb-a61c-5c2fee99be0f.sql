-- Fix QR code URLs with proper URL encoding
UPDATE audio_guides 
SET qr_code_url = CASE 
  WHEN qr_code_url LIKE 'data:image%' THEN 
    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=' || 
    regexp_replace('https://dsaqlgxajdnwoqvtsrqd.supabase.co/guide/' || id::text, '([^A-Za-z0-9\-_.~])', '%' || upper(to_hex(ascii(E'\\1'))), 'g')
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