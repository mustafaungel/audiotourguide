-- Create destinations table with hierarchical Country->City structure
CREATE TABLE public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'cultural',
  coordinates POINT,
  latitude NUMERIC,
  longitude NUMERIC,
  best_time_to_visit TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'beginner',
  popular_attractions TEXT[],
  cultural_significance TEXT,
  image_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  suggested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on destinations
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Create policies for destinations
CREATE POLICY "Anyone can view approved destinations" 
ON public.destinations 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Admins can view all destinations" 
ON public.destinations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Creators can view their suggested destinations" 
ON public.destinations 
FOR SELECT 
USING (auth.uid() = suggested_by);

CREATE POLICY "Admins can manage all destinations" 
ON public.destinations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Creators can suggest destinations" 
ON public.destinations 
FOR INSERT 
WITH CHECK (auth.uid() = suggested_by AND is_approved = false);

CREATE POLICY "Creators can update their own suggestions" 
ON public.destinations 
FOR UPDATE 
USING (auth.uid() = suggested_by AND is_approved = false);

-- Add destination_id to audio_guides table
ALTER TABLE public.audio_guides 
ADD COLUMN destination_id UUID REFERENCES public.destinations(id);

-- Create index for better performance
CREATE INDEX idx_destinations_country_city ON public.destinations(country, city);
CREATE INDEX idx_destinations_category ON public.destinations(category);
CREATE INDEX idx_destinations_approved ON public.destinations(is_approved);

-- Create function to approve destinations
CREATE OR REPLACE FUNCTION public.approve_destination(destination_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve destinations';
  END IF;
  
  -- Update the destination
  UPDATE public.destinations 
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = destination_id AND is_approved = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination not found or already approved';
  END IF;
  
  RETURN true;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();