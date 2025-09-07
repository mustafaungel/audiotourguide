import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuideCard } from '@/components/GuideCard';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CreatorMessaging } from '@/components/CreatorMessaging';
import { 
  Star, 
  MapPin, 
  Users, 
  Calendar,
  Award,
  MessageCircle,
  UserPlus,
  Share2,
  Instagram,
  Twitter,
  Globe,
  TrendingUp,
  Play,
  Heart,
  Trophy,
  Verified
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  specialties: string[];
  experience_years?: number;
  verification_status: string;
  verification_badge_type: string;
  social_profiles?: any;
  created_at: string;
  location?: string;
  followers_count?: number;
  total_guides?: number;
  total_plays?: number;
  avg_rating?: number;
  achievements?: any[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  price_usd: number;
  rating?: number;
  duration: number;
  category: string;
  difficulty: string;
  image_url?: string;
  total_purchases?: number;
  created_at: string;
}

const CreatorProfile = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'guides');

  useEffect(() => {
    if (creatorId) {
      fetchCreatorProfile();
      fetchCreatorGuides();
    }
  }, [creatorId]);

  const fetchCreatorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', creatorId)
        .single();

      if (error) throw error;
      
      // Calculate additional stats
      const statsData = await calculateCreatorStats(creatorId!);
      setCreator({ ...data, ...statsData });
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load creator profile",
      });
    }
  };

  const fetchCreatorGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching creator guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCreatorStats = async (userId: string) => {
    try {
      // Get total guides
      const { count: totalGuides } = await supabase
        .from('audio_guides')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('is_published', true);

      // Get total purchases (followers proxy)
      const { count: totalPurchases } = await supabase
        .from('user_purchases')
        .select('*', { count: 'exact', head: true })
        .in('guide_id', guides.map(g => g.id));

      // Calculate average rating
      const { data: avgRatingData } = await supabase
        .from('audio_guides')
        .select('rating')
        .eq('creator_id', userId)
        .eq('is_published', true);

      const avgRating = avgRatingData?.length 
        ? avgRatingData.reduce((sum, g) => sum + (g.rating || 0), 0) / avgRatingData.length
        : 0;

      return {
        total_guides: totalGuides || 0,
        followers_count: (totalPurchases || 0) * 3, // Rough follower estimation
        total_plays: (totalPurchases || 0) * 12, // Rough play estimation
        avg_rating: Math.round(avgRating * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {};
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following!",
      description: isFollowing 
        ? `You unfollowed ${creator?.full_name}` 
        : `You're now following ${creator?.full_name}`,
    });
  };

  const handleMessage = () => {
    toast({
      title: "Coming Soon",
      description: "Creator messaging will be available soon!",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creator?.full_name} - Cultural Guide Creator`,
          text: creator?.bio,
          url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Creator profile link copied to clipboard",
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <p className="text-muted-foreground mb-4">The creator profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-primary border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Creator Info */}
            <div className="flex items-start gap-6 flex-1">
              <div className="relative">
                <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-4 border-primary-foreground/20">
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-2xl">
                    {creator.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <VerificationBadge 
                    type={creator.verification_badge_type as any}
                    size="lg"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
                    {creator.full_name}
                  </h1>
                  {creator.verification_status === 'verified' && (
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                      <Verified className="h-4 w-4 mr-1" />
                      Verified Creator
                    </Badge>
                  )}
                </div>
                
                <p className="text-primary-foreground/90 text-lg mb-4 max-w-2xl">
                  {creator.bio}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {creator.specialties?.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                {/* Professional Info (Social links now hidden by default) */}
                <div className="flex gap-4 text-sm text-primary-foreground/80">
                  {creator.experience_years && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {creator.experience_years} years experience
                    </div>
                  )}
                  {creator.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {creator.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats & Actions */}
            <div className="lg:min-w-[300px]">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary-foreground mb-1">
                      {formatNumber(creator.followers_count || 0)}
                    </div>
                    <div className="text-sm text-primary-foreground/70">Followers</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary-foreground mb-1">
                      {creator.total_guides || 0}
                    </div>
                    <div className="text-sm text-primary-foreground/70">Guides</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary-foreground mb-1">
                      {formatNumber(creator.total_plays || 0)}
                    </div>
                    <div className="text-sm text-primary-foreground/70">Total Plays</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary-foreground mb-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      {creator.avg_rating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm text-primary-foreground/70">Rating</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  className={`flex-1 ${
                    isFollowing
                      ? 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30'
                      : 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleMessage}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleShare}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="guides">Audio Guides</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides" className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Audio Guides ({guides.length})</h2>
              <p className="text-muted-foreground">
                Explore {creator.full_name}'s collection of immersive audio experiences
              </p>
            </div>
            
            {guides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    id={guide.id}
                    title={guide.title}
                    description={guide.description}
                    location={guide.location}
                    price={guide.price_usd}
                    rating={guide.rating || 0}
                    duration={guide.duration}
                    category={guide.category}
                    difficulty={guide.difficulty}
                    imageUrl={guide.image_url}
                    totalPurchases={guide.total_purchases}
                    creatorName={creator.full_name}
                    creatorAvatar={creator.avatar_url}
                    onViewGuide={() => {
                      toast({
                        title: "Guide Preview",
                        description: "Guide player coming soon!",
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No guides yet</h3>
                <p className="text-muted-foreground">
                  {creator.full_name} hasn't published any guides yet.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="about" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>About {creator.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Biography</h3>
                  <p className="text-muted-foreground">{creator.bio}</p>
                </div>
                
                {creator.experience_years && (
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-muted-foreground">
                      {creator.experience_years} years of professional experience in cultural tourism and storytelling
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.specialties?.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Member Since</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(creator.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="message" className="mt-8">
            <CreatorMessaging
              creatorId={creatorId!}
              creatorName={creator.full_name}
              creatorAvatar={creator.avatar_url}
            />
          </TabsContent>

          <TabsContent value="achievements" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Achievements & Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creator.verification_status === 'verified' && (
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                      <Award className="h-8 w-8 text-accent" />
                      <div>
                        <h4 className="font-semibold">Verified Creator</h4>
                        <p className="text-sm text-muted-foreground">
                          Verified for authenticity and expertise
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold">Community Builder</h4>
                      <p className="text-sm text-muted-foreground">
                        Active in building the cultural discovery community
                      </p>
                    </div>
                  </div>
                  
                  {(creator.total_guides || 0) >= 10 && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Star className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h4 className="font-semibold">Prolific Creator</h4>
                        <p className="text-sm text-muted-foreground">
                          Created 10+ high-quality audio guides
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorProfile;