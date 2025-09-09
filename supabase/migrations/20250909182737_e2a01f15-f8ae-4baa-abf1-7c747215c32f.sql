-- Update Zelve guide price to meet Stripe minimum requirement (50 cents)
UPDATE audio_guides 
SET price_usd = 50
WHERE slug = 'zelve-open-air-museum-cappadocia-turkey';