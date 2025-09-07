-- Create creator_stories table
CREATE TABLE public.creator_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'text'
  content_url TEXT,
  content_text TEXT,
  duration_seconds INTEGER DEFAULT 24,
  background_color TEXT DEFAULT '#000000',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create story_views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  viewer_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create creator_updates table for feed content
CREATE TABLE public.creator_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'post', -- 'post', 'announcement', 'guide_update'
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  related_guide_id UUID,
  related_experience_id UUID,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create story_reactions table
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'love', 'wow', 'fire'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.creator_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_stories
CREATE POLICY "Anyone can view active stories" 
ON public.creator_stories 
FOR SELECT 
USING (is_active = true AND expires_at > now());

CREATE POLICY "Creators can manage their own stories" 
ON public.creator_stories 
FOR ALL 
USING (auth.uid() = creator_id);

-- RLS policies for story_views
CREATE POLICY "Users can create their own story views" 
ON public.story_views 
FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view their own story views" 
ON public.story_views 
FOR SELECT 
USING (auth.uid() = viewer_id);

CREATE POLICY "Creators can view their story analytics" 
ON public.story_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.creator_stories cs 
    WHERE cs.id = story_id AND cs.creator_id = auth.uid()
  )
);

-- RLS policies for creator_updates
CREATE POLICY "Anyone can view creator updates" 
ON public.creator_updates 
FOR SELECT 
USING (true);

CREATE POLICY "Creators can manage their own updates" 
ON public.creator_updates 
FOR ALL 
USING (auth.uid() = creator_id);

-- RLS policies for story_reactions
CREATE POLICY "Users can manage their own story reactions" 
ON public.story_reactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view story reactions" 
ON public.story_reactions 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_creator_stories_creator_id ON public.creator_stories(creator_id);
CREATE INDEX idx_creator_stories_active_expires ON public.creator_stories(is_active, expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_creator_updates_creator_id ON public.creator_updates(creator_id);
CREATE INDEX idx_story_reactions_story_id ON public.story_reactions(story_id);

-- Create triggers for updated_at
CREATE TRIGGER update_creator_stories_updated_at
BEFORE UPDATE ON public.creator_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_updates_updated_at
BEFORE UPDATE ON public.creator_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();