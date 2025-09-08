-- Fix the remaining function that needs search_path security setting
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'ART-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$;