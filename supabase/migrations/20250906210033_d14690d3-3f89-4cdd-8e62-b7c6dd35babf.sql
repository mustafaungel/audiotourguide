-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('traveler', 'admin', 'content_creator');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'traveler',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audio guides table
CREATE TABLE public.audio_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  difficulty TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',
  price_usd INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  audio_url TEXT,
  transcript TEXT,
  image_url TEXT,
  preview_url TEXT, -- 15 second preview
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  best_time TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user purchases table
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_paid INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  access_code TEXT NOT NULL UNIQUE, -- QR code content
  UNIQUE(user_id, guide_id)
);

-- Create reviews table
CREATE TABLE public.guide_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guide_id, user_id)
);

-- Create admin approvals table
CREATE TABLE public.admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for audio_guides
CREATE POLICY "Anyone can view published guides" ON public.audio_guides
  FOR SELECT USING (is_published = true AND is_approved = true);

CREATE POLICY "Creators can view their own guides" ON public.audio_guides
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all guides" ON public.audio_guides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Creators can insert guides" ON public.audio_guides
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own guides" ON public.audio_guides
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Admins can update all guides" ON public.audio_guides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_purchases
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for guide_reviews
CREATE POLICY "Anyone can view reviews" ON public.guide_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON public.guide_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.guide_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for admin_approvals
CREATE POLICY "Admins can view all approvals" ON public.admin_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert approvals" ON public.admin_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update guide rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_guide_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.audio_guides 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1) 
      FROM public.guide_reviews 
      WHERE guide_id = COALESCE(NEW.guide_id, OLD.guide_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.guide_reviews 
      WHERE guide_id = COALESCE(NEW.guide_id, OLD.guide_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.guide_id, OLD.guide_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for rating updates
CREATE TRIGGER update_guide_rating_on_insert
  AFTER INSERT ON public.guide_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_rating();

CREATE TRIGGER update_guide_rating_on_update
  AFTER UPDATE ON public.guide_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_rating();

CREATE TRIGGER update_guide_rating_on_delete
  AFTER DELETE ON public.guide_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_rating();

-- Function to update purchase count
CREATE OR REPLACE FUNCTION public.update_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.audio_guides 
  SET 
    total_purchases = (
      SELECT COUNT(*) 
      FROM public.user_purchases 
      WHERE guide_id = NEW.guide_id
    ),
    updated_at = now()
  WHERE id = NEW.guide_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for purchase count updates
CREATE TRIGGER update_purchase_count_on_insert
  AFTER INSERT ON public.user_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_purchase_count();

-- Generate access code function
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ART-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql;