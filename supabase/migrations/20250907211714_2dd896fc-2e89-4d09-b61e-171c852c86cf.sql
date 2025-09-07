-- Fix remaining QR codes pointing to lovable.dev with proper URL encoding
UPDATE audio_guides 
SET qr_code_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=' || 
                  regexp_replace('https://dsaqlgxajdnwoqvtsrqd.supabase.co/guide/' || id::text, ':', '%3A', 'g')
WHERE qr_code_url LIKE '%lovable.dev%';