import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  creator_id: string;
  content_type: 'image' | 'video' | 'text';
  content_url?: string;
  content_text?: string;
  duration_seconds: number;
  background_color: string;
  created_at: string;
  creator_name: string;
  creator_avatar: string;
}

interface CreatorStoriesProps {
  creatorId?: string;
  onClose: () => void;
}

export const CreatorStories: React.FC<CreatorStoriesProps> = ({ creatorId, onClose }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReacted, setHasReacted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStories = useCallback(async () => {
    try {
      const query = supabase
        .from('creator_stories')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (creatorId) {
        query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch creator profiles separately
      const creatorIds = [...new Set(data?.map(story => story.creator_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedStories = data?.map(story => ({
        ...story,
        creator_name: profileMap.get(story.creator_id)?.full_name || 'Unknown Creator',
        creator_avatar: profileMap.get(story.creator_id)?.avatar_url || '',
        content_type: story.content_type as 'image' | 'video' | 'text'
      })) || [];

      setStories(formattedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error loading stories",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, toast]);

  const markStoryAsViewed = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });
    } catch (error) {
      // Ignore duplicate key errors (user already viewed this story)
      console.debug('Story view tracking:', error);
    }
  }, [user]);

  const handleReaction = async (storyId: string, reactionType: string = 'like') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_reactions')
        .insert({
          story_id: storyId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) throw error;

      setHasReacted(true);
      toast({
        title: "Reaction sent!",
        description: "Your reaction has been shared with the creator.",
      });
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setHasReacted(false);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setHasReacted(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (stories.length > 0 && currentIndex < stories.length) {
      markStoryAsViewed(stories[currentIndex].id);
    }
  }, [currentIndex, stories, markStoryAsViewed]);

  useEffect(() => {
    if (stories.length === 0) return;

    const duration = stories[currentIndex]?.duration_seconds * 1000 || 24000;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, stories, goToNext]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stories...</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No stories available</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={currentStory.creator_avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentStory.creator_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-medium">{currentStory.creator_name}</h3>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation areas */}
      <div className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goToPrevious} />
      <div className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goToNext} />

      {/* Story content */}
      <div 
        className="w-full h-full flex items-center justify-center relative"
        style={{ backgroundColor: currentStory.background_color }}
      >
        {currentStory.content_type === 'image' && currentStory.content_url && (
          <img 
            src={currentStory.content_url} 
            alt="Story content"
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        {currentStory.content_type === 'video' && currentStory.content_url && (
          <video 
            src={currentStory.content_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        )}

        {currentStory.content_type === 'text' && (
          <div className="text-center p-8 max-w-md">
            <p className="text-white text-xl leading-relaxed">
              {currentStory.content_text}
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons (mobile) */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 md:hidden">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goToPrevious}
          className="text-white hover:bg-white/20"
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goToNext}
          className="text-white hover:bg-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Reaction buttons */}
      {user && (
        <div className="absolute bottom-8 right-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleReaction(currentStory.id, 'like')}
            className={`text-white hover:bg-white/20 ${hasReacted ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-6 h-6 ${hasReacted ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};