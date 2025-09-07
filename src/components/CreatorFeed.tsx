import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Pin, MapPin, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CreatorUpdate {
  id: string;
  creator_id: string;
  update_type: string;
  title?: string;
  content: string;
  image_url?: string;
  related_guide_id?: string;
  related_experience_id?: string;
  is_pinned: boolean;
  created_at: string;
  creator_name: string;
  creator_avatar: string;
  creator_verification_status: string;
}

interface CreatorFeedProps {
  creatorId?: string;
  showHeader?: boolean;
}

export const CreatorFeed: React.FC<CreatorFeedProps> = ({ creatorId, showHeader = true }) => {
  const [updates, setUpdates] = useState<CreatorUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUpdates();
  }, [creatorId]);

  const fetchUpdates = async () => {
    try {
      const query = supabase
        .from('creator_updates')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (creatorId) {
        query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch creator profiles separately
      const creatorIds = [...new Set(data?.map(update => update.creator_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, verification_status')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedUpdates = data?.map(update => ({
        ...update,
        creator_name: profileMap.get(update.creator_id)?.full_name || 'Unknown Creator',
        creator_avatar: profileMap.get(update.creator_id)?.avatar_url || '',
        creator_verification_status: profileMap.get(update.creator_id)?.verification_status || 'unverified'
      })) || [];

      setUpdates(formattedUpdates);
    } catch (error) {
      console.error('Error fetching creator updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Pin className="w-4 h-4" />;
      case 'guide_update':
        return <MapPin className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'guide_update':
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-muted rounded" />
                <div className="w-24 h-3 bg-muted rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-full h-4 bg-muted rounded" />
                <div className="w-3/4 h-4 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold mb-2">Creator Updates</h2>
          <p className="text-muted-foreground">
            Stay updated with your favorite creators' latest content and announcements
          </p>
        </div>
      )}

      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No updates yet</h3>
              <p className="text-muted-foreground">
                {creatorId 
                  ? "This creator hasn't shared any updates yet." 
                  : "Follow some creators to see their updates here."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card key={update.id} className={update.is_pinned ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={update.creator_avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {update.creator_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{update.creator_name}</h3>
                        {update.creator_verification_status === 'verified' && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        {update.is_pinned && (
                          <Badge variant="outline" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                        {update.update_type !== 'post' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getUpdateTypeColor(update.update_type)}`}
                          >
                            {getUpdateTypeIcon(update.update_type)}
                            <span className="ml-1 capitalize">
                              {update.update_type.replace('_', ' ')}
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {update.title && (
                  <h4 className="text-lg font-semibold">{update.title}</h4>
                )}
                
                <p className="text-foreground leading-relaxed">{update.content}</p>

                {update.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={update.image_url} 
                      alt="Update content"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Like</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Comment</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};