-- Fix the connect_user_to_creator function to handle guest purchases gracefully
CREATE OR REPLACE FUNCTION public.connect_user_to_creator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  guide_creator_id UUID;
BEGIN
  -- Only create connection for authenticated users (not guest purchases)
  IF NEW.user_id IS NOT NULL THEN
    -- Get the creator_id from the purchased guide
    SELECT creator_id INTO guide_creator_id
    FROM public.audio_guides
    WHERE id = NEW.guide_id;
    
    -- Create connection if it doesn't exist
    INSERT INTO public.creator_connections (user_id, creator_id, guide_id, connection_source)
    VALUES (NEW.user_id, guide_creator_id, NEW.guide_id, 'purchase')
    ON CONFLICT (user_id, creator_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$