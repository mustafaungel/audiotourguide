import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { GuideCard } from '@/components/GuideCard';
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
      // Handle demo creators
      if (creatorId?.startsWith('demo-')) {
        const demoCreators = {
          'demo-1': {
            id: 'demo-1',
            user_id: 'demo-1',
            full_name: 'Elena Rossi',
            bio: 'Passionate art historian with 15 years of experience guiding visitors through Europe\'s greatest museums and galleries. Specialized in Renaissance and Baroque art with published research on Italian masters.',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Art History', 'Museums', 'Renaissance', 'Italian Culture'],
            location: 'Rome, Italy',
            experience_years: 15,
            social_profiles: {},
            created_at: '2024-01-15T00:00:00Z',
            total_guides: 8,
            followers_count: 2340,
            total_plays: 12400,
            service_rating: 4.7,
            service_rating_count: 234,
            platform_rating: 4.5,
            platform_rating_count: 12,
            combined_rating: 4.6
          },
          'demo-2': {
            id: 'demo-2',
            user_id: 'demo-2',
            full_name: 'Kenji Tanaka',
            bio: 'Born and raised in Kyoto, I\'ve been sharing the secrets of traditional Japanese culture for over a decade. From ancient temples to modern street food, I know every hidden gem.',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Japanese Culture', 'Temples', 'Food Tours', 'Traditional Arts'],
            location: 'Kyoto, Japan',
            experience_years: 12,
            social_profiles: {},
            created_at: '2024-02-01T00:00:00Z',
            total_guides: 6,
            followers_count: 1890,
            total_plays: 9800,
            service_rating: 4.6,
            service_rating_count: 189,
            platform_rating: 4.0,
            platform_rating_count: 8,
            combined_rating: 4.4
          },
          'demo-3': {
            id: 'demo-3',
            user_id: 'demo-3',
            full_name: 'Dr. Maria Garcia',
            bio: 'Archaeological researcher turned tour guide. I\'ve excavated sites across Peru and now share the fascinating stories of ancient civilizations with travelers from around the world.',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Archaeology', 'Ancient History', 'Inca Culture', 'Hiking'],
            location: 'Cusco, Peru',
            experience_years: 18,
            social_profiles: {},
            created_at: '2024-01-20T00:00:00Z',
            total_guides: 4,
            followers_count: 3200,
            total_plays: 15600,
            service_rating: 4.8,
            service_rating_count: 320,
            platform_rating: 4.5,
            platform_rating_count: 15,
            combined_rating: 4.7
          },
          'demo-4': {
            id: 'demo-4',
            user_id: 'demo-4',
            full_name: 'Ahmed Hassan',
            bio: 'Professional Egyptologist and licensed tour guide with deep knowledge of ancient Egyptian civilization. I bring pharaohs\' stories to life through immersive storytelling.',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Egyptology', 'Ancient History', 'Archaeology', 'Desert Tours'],
            location: 'Cairo, Egypt',
            experience_years: 14,
            social_profiles: {},
            created_at: '2024-01-25T00:00:00Z',
            total_guides: 5,
            followers_count: 2850,
            total_plays: 11200,
            service_rating: 4.7,
            service_rating_count: 285,
            platform_rating: 4.0,
            platform_rating_count: 10,
            combined_rating: 4.5
          },
          'demo-5': {
            id: 'demo-5',
            user_id: 'demo-5',
            full_name: 'Sofia Andersson',
            bio: 'Marine biologist turned adventure guide specializing in Nordic wilderness and Viking history. Certified wilderness guide with expertise in sustainable eco-tourism.',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Viking History', 'Marine Biology', 'Nordic Culture', 'Eco-Tourism'],
            location: 'Bergen, Norway',
            experience_years: 10,
            social_profiles: {},
            created_at: '2024-02-10T00:00:00Z',
            total_guides: 7,
            followers_count: 1650,
            total_plays: 8900,
            service_rating: 4.5,
            service_rating_count: 165,
            platform_rating: 3.5,
            platform_rating_count: 6,
            combined_rating: 4.2
          },
          'demo-6': {
            id: 'demo-6',
            user_id: 'demo-6',
            full_name: 'Rajesh Patel',
            bio: 'Third-generation spice merchant and culinary historian from Mumbai. I share the authentic flavors and stories behind India\'s diverse regional cuisines.',
            avatar_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            verification_badge_type: 'verified',
            specialties: ['Indian Cuisine', 'Spice Trading', 'Cultural Heritage', 'Food History'],
            location: 'Mumbai, India',
            experience_years: 16,
            social_profiles: {},
            created_at: '2024-02-15T00:00:00Z',
            total_guides: 9,
            followers_count: 2950,
            total_plays: 13400,
            service_rating: 4.8,
            service_rating_count: 295,
            platform_rating: 4.5,
            platform_rating_count: 14,
            combined_rating: 4.7
          }
        };

        const demoCreator = demoCreators[creatorId as keyof typeof demoCreators];
        if (demoCreator) {
          setCreator(demoCreator);
          return;
        }
      }

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
      // Demo guides for demo creators
      if (creatorId?.startsWith('demo-')) {
        const demoGuides = {
          'demo-1': [
            {
              id: 'demo-guide-1',
              title: 'Masterpieces of the Louvre',
              description: 'Discover the stories behind the world\'s most famous artworks including the Mona Lisa, Venus de Milo, and Winged Victory.',
              location: 'Paris, France',
              duration: 120,
              price_usd: 25,
              rating: 4.8,
              total_purchases: 89,
              image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
              category: 'Museums',
              difficulty: 'Beginner',
              created_at: '2024-03-01T00:00:00Z'
            },
            {
              id: 'demo-guide-2',
              title: 'Vatican Museums Deep Dive',
              description: 'An intimate journey through the Vatican\'s treasures, from Michelangelo\'s Sistine Chapel to the Renaissance Rooms.',
              location: 'Vatican City',
              duration: 180,
              price_usd: 35,
              rating: 4.9,
              total_purchases: 156,
              image_url: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800',
              category: 'Museums',
              difficulty: 'Intermediate',
              created_at: '2024-03-15T00:00:00Z'
            }
          ],
          'demo-2': [
            {
              id: 'demo-guide-3',
              title: 'Zen Temples of Kyoto',
              description: 'Experience tranquility in Kyoto\'s most sacred temples while learning about Buddhist philosophy and Japanese spirituality.',
              location: 'Kyoto, Japan',
              duration: 180,
              price_usd: 28,
              rating: 4.9,
              total_purchases: 112,
              image_url: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800',
              category: 'Temples',
              difficulty: 'Beginner',
              created_at: '2024-03-05T00:00:00Z'
            },
            {
              id: 'demo-guide-7',
              title: 'Traditional Japanese Tea Ceremony',
              description: 'Learn the ancient art of tea ceremony and its spiritual significance in Japanese culture.',
              location: 'Kyoto, Japan',
              duration: 90,
              price_usd: 22,
              rating: 4.8,
              total_purchases: 78,
              image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
              category: 'Cultural',
              difficulty: 'Beginner',
              created_at: '2024-03-20T00:00:00Z'
            }
          ],
          'demo-3': [
            {
              id: 'demo-guide-4',
              title: 'Mysteries of Machu Picchu',
              description: 'Uncover the secrets of the Lost City of the Incas with insights from recent archaeological discoveries.',
              location: 'Machu Picchu, Peru',
              duration: 240,
              price_usd: 45,
              rating: 4.9,
              total_purchases: 201,
              image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
              category: 'Archaeology',
              difficulty: 'Intermediate',
              created_at: '2024-03-10T00:00:00Z'
            }
          ],
          'demo-4': [
            {
              id: 'demo-guide-5',
              title: 'Secrets of the Great Pyramid',
              description: 'Explore the engineering marvels and hidden chambers of the last surviving Wonder of the Ancient World.',
              location: 'Giza, Egypt',
              duration: 150,
              price_usd: 32,
              rating: 4.8,
              total_purchases: 145,
              image_url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73702?w=800',
              category: 'Archaeology',
              difficulty: 'Intermediate',
              created_at: '2024-03-12T00:00:00Z'
            },
            {
              id: 'demo-guide-8',
              title: 'Valley of the Kings Discovery',
              description: 'Journey through the royal tombs and learn about pharaohs\' preparations for the afterlife.',
              location: 'Luxor, Egypt',
              duration: 200,
              price_usd: 38,
              rating: 4.9,
              total_purchases: 167,
              image_url: 'https://images.unsplash.com/photo-1478520973959-66b6b8c60bac?w=800',
              category: 'History',
              difficulty: 'Advanced',
              created_at: '2024-03-25T00:00:00Z'
            }
          ],
          'demo-5': [
            {
              id: 'demo-guide-6',
              title: 'Viking Heritage Trail',
              description: 'Follow in the footsteps of Norse explorers and discover authentic Viking settlements and artifacts.',
              location: 'Bergen, Norway',
              duration: 180,
              price_usd: 30,
              rating: 4.7,
              total_purchases: 98,
              image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
              category: 'History',
              difficulty: 'Intermediate',
              created_at: '2024-03-08T00:00:00Z'
            },
            {
              id: 'demo-guide-9',
              title: 'Nordic Fjords and Wildlife',
              description: 'Explore pristine fjords and learn about marine ecosystems from a marine biologist\'s perspective.',
              location: 'Norwegian Fjords',
              duration: 240,
              price_usd: 42,
              rating: 4.8,
              total_purchases: 134,
              image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
              category: 'Nature',
              difficulty: 'Intermediate',
              created_at: '2024-03-30T00:00:00Z'
            }
          ],
          'demo-6': [
            {
              id: 'demo-guide-10',
              title: 'Spice Markets of Mumbai',
              description: 'Navigate the bustling spice markets and learn the secrets behind India\'s most aromatic treasures.',
              location: 'Mumbai, India',
              duration: 120,
              price_usd: 26,
              rating: 4.9,
              total_purchases: 189,
              image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
              category: 'Culinary',
              difficulty: 'Beginner',
              created_at: '2024-03-18T00:00:00Z'
            },
            {
              id: 'demo-guide-11',
              title: 'Street Food Chronicles',
              description: 'Discover authentic street food culture and the stories behind Mumbai\'s most beloved local dishes.',
              location: 'Mumbai, India',
              duration: 150,
              price_usd: 28,
              rating: 4.8,
              total_purchases: 156,
              image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
              category: 'Culinary',
              difficulty: 'Beginner',
              created_at: '2024-04-02T00:00:00Z'
            }
          ]
        };

        setGuides(demoGuides[creatorId as keyof typeof demoGuides] || []);
        return;
      }

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
                  {creator.experience_years && (
                    <ExperienceBracketBadge 
                      experienceYears={creator.experience_years}
                      showTooltip={true}
                    />
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
              {/* Stats Grid - Convert to horizontal layout on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
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
                  <CardContent className="p-4">
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
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="guides">Audio Guides</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
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
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {guides.map((guide) => (
                    <CarouselItem key={guide.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
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
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
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