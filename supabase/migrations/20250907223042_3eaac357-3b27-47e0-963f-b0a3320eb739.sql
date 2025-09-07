-- Update the guide price to meet Stripe's minimum requirement of 50 cents
UPDATE public.audio_guides 
SET price_usd = 50 
WHERE id = 'c0a65d8f-0dce-46f0-981d-1819f84730e5' AND price_usd < 50;