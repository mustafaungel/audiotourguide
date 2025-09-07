-- Create creator connections table to track user-creator relationships
CREATE TABLE public.creator_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connection_source TEXT NOT NULL DEFAULT 'purchase', -- 'purchase', 'manual_follow', 'recommendation'
  guide_id UUID, -- The guide that led to this connection (if applicable)
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, creator_id)
);

-- Enable Row Level Security
ALTER TABLE public.creator_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own connections" 
ON public.creator_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" 
ON public.creator_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
ON public.creator_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create messaging table for creator-user communication
CREATE TABLE public.creator_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'question', 'recommendation'
  related_guide_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.creator_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messaging
CREATE POLICY "Users can view their own messages" 
ON public.creator_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.creator_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark their received messages as read" 
ON public.creator_messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create function to automatically connect user to creator after purchase
CREATE OR REPLACE FUNCTION public.connect_user_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guide_creator_id UUID;
BEGIN
  -- Get the creator_id from the purchased guide
  SELECT creator_id INTO guide_creator_id
  FROM public.audio_guides
  WHERE id = NEW.guide_id;
  
  -- Create connection if it doesn't exist
  INSERT INTO public.creator_connections (user_id, creator_id, guide_id, connection_source)
  VALUES (NEW.user_id, guide_creator_id, NEW.guide_id, 'purchase')
  ON CONFLICT (user_id, creator_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically connect users to creators after purchase
CREATE TRIGGER after_purchase_connect_creator
AFTER INSERT ON public.user_purchases
FOR EACH ROW
EXECUTE FUNCTION public.connect_user_to_creator();