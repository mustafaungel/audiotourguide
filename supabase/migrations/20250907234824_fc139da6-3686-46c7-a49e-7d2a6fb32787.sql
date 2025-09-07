-- Fix test guide price to meet Stripe minimum requirement
UPDATE public.audio_guides 
SET price_usd = 50, updated_at = now()
WHERE id = '143e9aa0-c1a7-4304-be24-bb5d3becb8d1' 
AND price_usd < 50;