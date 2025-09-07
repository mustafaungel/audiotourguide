import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CreatorStories } from './CreatorStories';
import { StoryCreation } from './StoryCreation';
import { useAuth } from '@/contexts/AuthContext';

interface Creator {
  id: string;
  full_name: string;
  avatar_url: string;
  has_stories: boolean;
  latest_story_created_at: string;
}

export const CreatorStoriesViewer: React.FC = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [showStoryCreation, setShowStoryCreation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    fetchCreatorsWithStories();
  }, []);

  const fetchCreatorsWithStories = async () => {
    try {
      // First get all creators who have active stories
      const { data: stories, error: storiesError } = await supabase
        .from('creator_stories')
        .select('creator_id, created_at')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Group by creator and get latest story timestamp
      const creatorStories = new Map();
      stories?.forEach(story => {
        if (!creatorStories.has(story.creator_id) || 
            new Date(story.created_at) > new Date(creatorStories.get(story.creator_id))) {
          creatorStories.set(story.creator_id, story.created_at);
        }
      });

      const creatorIds = Array.from(creatorStories.keys());
      
      if (creatorIds.length === 0) {
        setCreators([]);
        setIsLoading(false);
        return;
      }

      // Fetch creator profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      if (profilesError) throw profilesError;

      const formattedCreators = profiles?.map(profile => ({
        id: profile.user_id,
        full_name: profile.full_name || 'Unknown Creator',
        avatar_url: profile.avatar_url || '',
        has_stories: true,
        latest_story_created_at: creatorStories.get(profile.user_id)
      })) || [];

      // Sort by latest story timestamp
      formattedCreators.sort((a, b) => 
        new Date(b.latest_story_created_at).getTime() - new Date(a.latest_story_created_at).getTime()
      );

      setCreators(formattedCreators);
    } catch (error) {
      console.error('Error fetching creators with stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryCreated = () => {
    setShowStoryCreation(false);
    fetchCreatorsWithStories();
  };

  if (selectedCreatorId) {
    return (
      <CreatorStories
        creatorId={selectedCreatorId}
        onClose={() => setSelectedCreatorId(null)}
      />
    );
  }

  if (showStoryCreation) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <StoryCreation
          onStoryCreated={handleStoryCreated}
          onClose={() => setShowStoryCreation(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 p-4 overflow-x-auto">
        {/* Add your story button (only for content creators) */}
        {user && userProfile?.role === 'content_creator' && (
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowStoryCreation(true)}
              className="h-20 w-20 rounded-full border-2 border-dashed border-primary/50 hover:border-primary flex flex-col items-center justify-center gap-1"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">Add Story</span>
            </Button>
          </div>
        )}

        {/* Creator stories */}
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-20 h-20 bg-muted rounded-full animate-pulse" />
              <div className="w-16 h-3 bg-muted rounded mt-2 mx-auto animate-pulse" />
            </div>
          ))
        ) : creators.length === 0 ? (
          <Card className="flex-1 p-8 text-center">
            <p className="text-muted-foreground">No stories available right now</p>
            <p className="text-sm text-muted-foreground mt-1">
              Follow some creators to see their stories here
            </p>
          </Card>
        ) : (
          creators.map((creator) => (
            <div key={creator.id} className="flex-shrink-0 text-center">
              <button
                onClick={() => setSelectedCreatorId(creator.id)}
                className="relative group"
              >
                <div className="w-20 h-20 p-1 bg-gradient-to-tr from-primary via-primary/80 to-accent rounded-full">
                  <div className="w-full h-full bg-background rounded-full p-1">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={creator.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {creator.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-xs font-medium mt-2 max-w-[80px] truncate">
                  {creator.full_name}
                </p>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};