import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, MapPin, Users, Heart, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MeetYourCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideId: string;
  creatorId: string;
}

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  social_profiles: any;
}

interface CreatorStats {
  totalGuides: number;
  avgRating: number;
  totalPurchases: number;
  followers: number;
}

export function MeetYourCreatorModal({ isOpen, onClose, guideId, creatorId }: MeetYourCreatorModalProps) {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [moreGuides, setMoreGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && creatorId) {
      fetchCreatorData();
    }
  }, [isOpen, creatorId]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);

      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', creatorId)
        .single();

      if (profileError) throw profileError;
      setCreator(profileData);

      // Fetch creator stats
      const { data: guidesData, error: guidesError } = await supabase
        .from('audio_guides')
        .select('id, rating, total_purchases')
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      if (!guidesError && guidesData) {
        const totalGuides = guidesData.length;
        const avgRating = guidesData.reduce((sum, guide) => sum + (guide.rating || 0), 0) / totalGuides;
        const totalPurchases = guidesData.reduce((sum, guide) => sum + (guide.total_purchases || 0), 0);
        
        setStats({
          totalGuides,
          avgRating: Math.round(avgRating * 10) / 10,
          totalPurchases,
          followers: Math.floor(totalPurchases * 0.3) // Estimate followers
        });
      }

      // Fetch 3 more guides from this creator (excluding current)
      const { data: moreGuidesData, error: moreGuidesError } = await supabase
        .from('audio_guides')
        .select('id, title, description, image_url, price_usd, rating, location')
        .eq('creator_id', creatorId)
        .eq('is_published', true)
        .neq('id', guideId)
        .limit(3);

      if (!moreGuidesError) {
        setMoreGuides(moreGuidesData || []);
      }

      // Check if already following
      const { data: connectionData } = await supabase
        .from('creator_connections')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .maybeSingle();

      setIsFollowing(!!connectionData);

    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast({
        title: "Error",
        description: "Failed to load creator information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('creator_connections')
          .update({ is_active: false })
          .eq('creator_id', creatorId)
          .eq('user_id', user?.id);
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You're no longer following ${creator?.full_name}`,
        });
      } else {
        // Follow
        await supabase
          .from('creator_connections')
          .insert({
            user_id: user?.id,
            creator_id: creatorId,
            connection_source: 'manual_follow'
          });
        
        setIsFollowing(true);
        toast({
          title: "Following!",
          description: `You're now following ${creator?.full_name}`,
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleMessage = () => {
    navigate(`/creator/${creatorId}?tab=message`);
    onClose();
  };

  const handleViewProfile = () => {
    navigate(`/creator/${creatorId}`);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Meet Your Guide Creator!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Creator Profile Header */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={creator.avatar_url} />
                <AvatarFallback className="text-lg">
                  {creator.full_name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{creator.full_name}</h3>
                  {creator.verification_status === 'verified' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-3">{creator.bio}</p>
                
                {creator.specialties && creator.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {creator.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}

                {stats && (
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="font-semibold">{stats.totalGuides}</div>
                      <div className="text-xs text-muted-foreground">Guides</div>
                    </div>
                    <div>
                      <div className="font-semibold flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {stats.avgRating}
                      </div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                    <div>
                      <div className="font-semibold">{stats.totalPurchases}</div>
                      <div className="text-xs text-muted-foreground">Tours</div>
                    </div>
                    <div>
                      <div className="font-semibold">{stats.followers}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                className="flex-1"
              >
                <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" onClick={handleMessage} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="ghost" onClick={handleViewProfile}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* More Guides Section */}
          {moreGuides.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Discover More from {creator.full_name}</h4>
              <div className="grid gap-4">
                {moreGuides.map((guide) => (
                  <Card 
                    key={guide.id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      navigate(`/guide/${guide.id}`);
                      onClose();
                    }}
                  >
                    <div className="flex gap-3">
                      <img
                        src={guide.image_url || "/placeholder.svg"}
                        alt={guide.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium line-clamp-1">{guide.title}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {guide.location}
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {guide.rating || 0}
                          </div>
                          <div className="text-sm font-semibold">
                            ${(guide.price_usd / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue Exploring
            </Button>
            <Button onClick={handleViewProfile} className="flex-1">
              View Full Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}