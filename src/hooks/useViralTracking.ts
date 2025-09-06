import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useViralTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  const trackEngagement = useCallback(async (
    action: 'view' | 'share' | 'bookmark' | 'achievement',
    guideId: string,
    options: {
      platform?: string;
      metadata?: Record<string, any>;
      userId?: string;
    } = {}
  ) => {
    try {
      setIsTracking(true);

      const { data, error } = await supabase.functions.invoke('track-viral-engagement', {
        body: {
          action,
          guide_id: guideId,
          platform: options.platform,
          user_id: options.userId,
          metadata: options.metadata || {}
        }
      });

      if (error) throw error;

      // Show success feedback for shares
      if (action === 'share') {
        const viralMessages = [
          "🚀 Your share is going viral!",
          "🔥 Spreading the travel magic!",
          "✨ Another explorer discovers this gem!",
          "🌟 Your recommendation is making waves!",
          "🎯 Viral content shared successfully!"
        ];
        
        toast({
          title: viralMessages[Math.floor(Math.random() * viralMessages.length)],
          description: `Shared on ${options.platform || 'social media'}`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error tracking engagement:', error);
      toast({
        title: "Tracking failed",
        description: "Unable to track engagement at the moment",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  }, [toast]);

  const generateViralContent = useCallback(async (location: string, trendingData?: any) => {
    try {
      setIsTracking(true);

      const { data, error } = await supabase.functions.invoke('generate-viral-content', {
        body: {
          location,
          trending_data: trendingData,
          content_type: 'guide'
        }
      });

      if (error) throw error;

      toast({
        title: "🎯 Viral content generated!",
        description: `Created trending guide for ${location}`,
      });

      return data;
    } catch (error) {
      console.error('Error generating viral content:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate viral content",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  }, [toast]);

  return {
    trackEngagement,
    generateViralContent,
    isTracking
  };
};