import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as CarouselComponents from '@/components/ui/carousel';
import { GuideCard } from '@/components/GuideCard';
import { LiveExperiencesList } from '@/components/LiveExperiencesList';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CreatorMessaging } from '@/components/CreatorMessaging';
import { DualRatingDisplay } from '@/components/DualRatingDisplay';
import { ServiceRatingForm } from '@/components/ServiceRatingForm';
import { PlatformRatingManager } from '@/components/PlatformRatingManager';
import { ExperienceBracketBadge } from '@/components/ExperienceBracketBadge';
import { CreatorProfile as CreatorProfileType } from '@/types/creator';
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

// Use the imported type instead of redefining

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
  
  const [creator, setCreator] = useState<CreatorProfileType | null>(null);
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
      // No demo creators - only real data from database

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
      // No demo guides - only fetch real data

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
         service_rating: Math.round(avgRating * 10) / 10,
         service_rating_count: totalPurchases || 0,
         platform_rating: 0,
         platform_rating_count: 0,
         combined_rating: Math.round(avgRating * 10) / 10
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
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="flex flex-col gap-6 md:gap-8 items-center md:items-start md:flex-row">
            {/* Creator Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 flex-1 w-full">
              <div className="relative">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 border-4 border-primary-foreground/20">
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-lg md:text-2xl">
                    {creator.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {creator.verification_status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Verified className="h-3 w-3 md:h-4 md:w-4" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 md:mb-2 justify-center md:justify-start">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground">
                    {creator.full_name}
                  </h1>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {creator.verification_status === 'verified' && (
                      <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs md:text-sm">
                        <Verified className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {creator.experience_years && (
                      <ExperienceBracketBadge 
                        experienceYears={creator.experience_years}
                        showTooltip={true}
                      />
                    )}
                  </div>
                </div>
                
                <p className="text-primary-foreground/90 text-sm md:text-lg mb-3 md:mb-4 max-w-2xl leading-relaxed">
                  {creator.bio}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4 justify-center md:justify-start">
                  {creator.specialties?.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs md:text-sm">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                {/* Professional Info */}
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-primary-foreground/80 justify-center md:justify-start">
                  {creator.experience_years && (
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{creator.experience_years} years experience</span>
                    </div>
                  )}
                  {creator.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{creator.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats & Actions - Mobile friendly layout */}
            <div className="w-full md:min-w-[300px] lg:min-w-[320px]">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 min-h-[70px] md:min-h-[80px]">
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-primary-foreground mb-0.5 md:mb-1">
                      {formatNumber(creator.followers_count || 0)}
                    </div>
                    <div className="text-xs md:text-sm text-primary-foreground/70">Followers</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 min-h-[70px] md:min-h-[80px]">
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-primary-foreground mb-0.5 md:mb-1">
                      {creator.total_guides || 0}
                    </div>
                    <div className="text-xs md:text-sm text-primary-foreground/70">Guides</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 min-h-[70px] md:min-h-[80px]">
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-primary-foreground mb-0.5 md:mb-1">
                      {formatNumber(creator.total_plays || 0)}
                    </div>
                    <div className="text-xs md:text-sm text-primary-foreground/70">Plays</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground/10 border-primary-foreground/20 col-span-2 md:col-span-2 lg:col-span-1 min-h-[100px] md:min-h-[120px]">
                  <CardContent className="p-3 md:p-4 h-full flex flex-col justify-center">
                     <DualRatingDisplay
                       serviceRating={creator.service_rating}
                       serviceRatingCount={creator.service_rating_count || 0}
                       platformRating={creator.platform_rating}
                       platformRatingCount={creator.platform_rating_count}
                       combinedRating={creator.combined_rating}
                       experienceYears={creator.experience_years}
                       variant="card"
                     />
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-2">
                <Button
                  onClick={handleFollow}
                  className={`flex-1 min-h-[44px] ${
                    isFollowing
                      ? 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30'
                      : 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleMessage}
                    className="text-primary-foreground hover:bg-primary-foreground/20 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="ml-2 sm:hidden">Message</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleShare}
                    className="text-primary-foreground hover:bg-primary-foreground/20 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="ml-2 sm:hidden">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-auto lg:w-[600px]">
            <TabsTrigger value="guides" className="text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
              <span className="hidden sm:inline">Audio Guides</span>
              <span className="sm:hidden">Guides</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">About</TabsTrigger>
            <TabsTrigger value="message" className="text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">Message</TabsTrigger>
            <TabsTrigger value="ratings" className="text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
              <span className="hidden sm:inline">Ratings</span>
              <span className="sm:hidden">Rate</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
              <span className="hidden sm:inline">Achievements</span>
              <span className="sm:hidden">Awards</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides" className="mt-4 md:mt-8">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Audio Guides ({guides.length})</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Explore {creator.full_name}'s collection of immersive audio experiences
              </p>
            </div>
            
            {guides.length > 0 ? (
              <CarouselComponents.Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselComponents.CarouselContent className="-ml-2 md:-ml-4">
                  {guides.map((guide) => (
                    <CarouselComponents.CarouselItem key={guide.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <div className="h-full">
                        <GuideCard
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
                      </div>
                    </CarouselComponents.CarouselItem>
                  ))}
                </CarouselComponents.CarouselContent>
                <CarouselComponents.CarouselPrevious className="-left-4 md:-left-12" />
                <CarouselComponents.CarouselNext className="-right-4 md:-right-12" />
              </CarouselComponents.Carousel>
            ) : (
              <div className="text-center py-8 md:py-12">
                <Play className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2">No guides yet</h3>
                <p className="text-muted-foreground text-sm md:text-base">
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

          <TabsContent value="ratings" className="mt-8">
            <div className="space-y-6">
              {user && user.id !== creator?.user_id && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Rate This Creator</h2>
                  <ServiceRatingForm
                    creatorId={creator?.user_id || ''}
                    onSubmit={() => {
                      // Refresh creator data after rating
                      fetchCreatorProfile();
                    }}
                  />
                </div>
              )}
              
              <PlatformRatingManager
                creatorId={creator?.user_id || ''}
                creatorExperienceYears={creator?.experience_years || 0}
                onUpdate={() => {
                  // Refresh creator data after platform rating update
                  fetchCreatorProfile();
                }}
              />
            </div>
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