-- Fix the price and add image URL for the Cappadocia guide
UPDATE public.audio_guides 
SET 
  price_usd = 50,
  image_url = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/guide-images/cappadocia-goreme.jpg',
  updated_at = now()
WHERE id = '936b7738-8086-4bf8-97b3-206d0f0c9c8e';