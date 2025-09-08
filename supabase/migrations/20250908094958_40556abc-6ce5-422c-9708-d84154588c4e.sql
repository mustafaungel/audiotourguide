-- Create homepage_stats table for managing dynamic stats on homepage
CREATE TABLE public.homepage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL,
  stat_value INTEGER NOT NULL,
  stat_label TEXT NOT NULL,
  stat_description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT NOT NULL DEFAULT '🌍',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active homepage stats" 
ON public.homepage_stats 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage homepage stats" 
ON public.homepage_stats 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_homepage_stats_updated_at
BEFORE UPDATE ON public.homepage_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stats
INSERT INTO public.homepage_stats (stat_type, stat_value, stat_label, stat_description, display_order, icon) VALUES
('unesco_sites', 1154, 'UNESCO Sites', 'World Heritage destinations', 1, '🏛️'),
('museums', 55000, 'Museums', 'Cultural institutions worldwide', 2, '🗺️'),
('landmarks', 10000, 'Landmarks', 'Iconic destinations covered', 3, '🎨'),
('countries', 195, 'Countries', 'Global travel experiences', 4, '🌍');