-- Create secure function to verify master access codes (bypasses RLS)
CREATE OR REPLACE FUNCTION public.verify_master_access_code(p_guide_id uuid, p_access_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the master access code exists for the guide
  -- This bypasses RLS to allow access to hidden guides via share links
  RETURN EXISTS (
    SELECT 1 FROM public.audio_guides 
    WHERE id = p_guide_id 
    AND master_access_code = p_access_code
  );
END;
$$;