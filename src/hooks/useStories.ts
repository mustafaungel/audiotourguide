import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createStory = useCallback(async (storyData: {
    content_type: 'image' | 'video' | 'text';
    content_url?: string;
    content_text?: string;
    duration_seconds?: number;
    background_color?: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create stories.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('creator_stories')
        .insert({
          creator_id: user.id,
          ...storyData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Story created!",
        description: "Your story has been published successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error creating story",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

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

  const reactToStory = useCallback(async (storyId: string, reactionType: string = 'like') => {
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

      toast({
        title: "Reaction sent!",
        description: "Your reaction has been shared with the creator.",
      });
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  }, [user, toast]);

  const getStoryAnalytics = useCallback(async (creatorId?: string) => {
    if (!user) return null;

    try {
      const query = supabase
        .from('creator_stories')
        .select(`
          id,
          created_at,
          story_views!story_views_story_id_fkey(count),
          story_reactions!story_reactions_story_id_fkey(count)
        `)
        .eq('creator_id', creatorId || user.id)
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching story analytics:', error);
      return null;
    }
  }, [user]);

  return {
    createStory,
    markStoryAsViewed,
    reactToStory,
    getStoryAnalytics,
    isLoading,
  };
};