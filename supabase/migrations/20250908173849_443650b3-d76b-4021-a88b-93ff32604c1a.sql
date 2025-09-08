-- Drop the old generate_slug function that only takes title
DROP FUNCTION IF EXISTS public.generate_slug(TEXT);