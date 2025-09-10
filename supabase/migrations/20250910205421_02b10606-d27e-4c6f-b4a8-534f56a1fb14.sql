-- Create guest_reviews table for audio guide reviews
CREATE TABLE public.guest_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guest_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for guest reviews
CREATE POLICY "Approved guest reviews are viewable by everyone" 
ON public.guest_reviews 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can create guest reviews" 
ON public.guest_reviews 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all guest reviews" 
ON public.guest_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update guest reviews" 
ON public.guest_reviews 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete guest reviews" 
ON public.guest_reviews 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_guest_reviews_updated_at
BEFORE UPDATE ON public.guest_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_guest_reviews_guide_id ON public.guest_reviews(guide_id);
CREATE INDEX idx_guest_reviews_approved ON public.guest_reviews(is_approved);
CREATE INDEX idx_guest_reviews_created_at ON public.guest_reviews(created_at DESC);