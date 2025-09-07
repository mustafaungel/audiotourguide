-- Create live_experiences table for virtual tours and live bookings
CREATE TABLE public.live_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  experience_type TEXT NOT NULL DEFAULT 'virtual_tour', -- virtual_tour, live_walkthrough, cultural_experience, cooking_class
  duration_minutes INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  max_participants INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requirements TEXT, -- what participants need
  included_items TEXT, -- what's included in the experience
  language TEXT NOT NULL DEFAULT 'English',
  difficulty_level TEXT NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced
  category TEXT NOT NULL, -- culture, food, nature, history, art
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create experience_bookings table to track user bookings
CREATE TABLE public.experience_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  experience_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, refunded
  stripe_payment_id TEXT,
  special_requests TEXT,
  meeting_link TEXT, -- for virtual experiences
  booking_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator_availability table for scheduling
CREATE TABLE public.creator_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_bookings_per_slot INTEGER NOT NULL DEFAULT 3,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.live_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_availability ENABLE ROW LEVEL SECURITY;

-- Policies for live_experiences
CREATE POLICY "Anyone can view active experiences" 
ON public.live_experiences 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Creators can manage their own experiences" 
ON public.live_experiences 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all experiences" 
ON public.live_experiences 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Policies for experience_bookings
CREATE POLICY "Users can view their own bookings" 
ON public.experience_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Creators can view bookings for their experiences" 
ON public.experience_bookings 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own bookings" 
ON public.experience_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.experience_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Creators can update bookings for their experiences" 
ON public.experience_bookings 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Policies for creator_availability
CREATE POLICY "Anyone can view creator availability" 
ON public.creator_availability 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Creators can manage their own availability" 
ON public.creator_availability 
FOR ALL 
USING (auth.uid() = creator_id);

-- Create triggers for timestamp updates
CREATE TRIGGER update_live_experiences_updated_at
BEFORE UPDATE ON public.live_experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experience_bookings_updated_at
BEFORE UPDATE ON public.experience_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_availability_updated_at
BEFORE UPDATE ON public.creator_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_live_experiences_creator_id ON public.live_experiences(creator_id);
CREATE INDEX idx_live_experiences_category ON public.live_experiences(category);
CREATE INDEX idx_live_experiences_active ON public.live_experiences(is_active);
CREATE INDEX idx_experience_bookings_user_id ON public.experience_bookings(user_id);
CREATE INDEX idx_experience_bookings_creator_id ON public.experience_bookings(creator_id);
CREATE INDEX idx_experience_bookings_scheduled_for ON public.experience_bookings(scheduled_for);
CREATE INDEX idx_creator_availability_creator_id ON public.creator_availability(creator_id);
CREATE INDEX idx_creator_availability_day_time ON public.creator_availability(day_of_week, start_time, end_time);