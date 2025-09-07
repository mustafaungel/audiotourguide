import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { SocialShare } from '@/components/SocialShare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceBooking } from '@/components/ExperienceBooking';
import { useViralTracking } from '@/hooks/useViralTracking';
import { 
  Star, 
  MapPin, 
  Users, 
  Clock,
  Calendar,
  Award,
  MessageCircle,
  Share2,
  Heart,
  DollarSign,
  Globe,
  Shield,
  Play
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ExperienceDetail = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const navigate = useNavigate();
  const { trackEngagement } = useViralTracking();
  const [experience, setExperience] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (experienceId) {
      fetchExperienceDetail();
    }
  }, [experienceId]);

  const fetchExperienceDetail = async () => {
    try {
      // Demo experience data
      const demoExperiences = {
        'exp-1': {
          id: 'exp-1',
          title: 'Virtual Vatican Museums Tour',
          description: 'Take an exclusive virtual tour through the Vatican Museums with art historian Elena Rossi. Explore the Sistine Chapel, Raphael Rooms, and discover hidden treasures normally closed to the public. This interactive experience includes live Q&A and behind-the-scenes stories.',
          creator_id: 'demo-1',
          price_usd: 35,
          duration_minutes: 90,
          max_participants: 15,
          location: 'Vatican City (Virtual)',
          category: 'Museums',
          experience_type: 'virtual_tour',
          difficulty_level: 'beginner',
          language: 'English',
          image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
          requirements: 'Stable internet connection, computer or tablet with camera/microphone',
          included_items: 'Digital guide materials, exclusive photos, recording access for 48 hours',
          rating: 4.8,
          total_bookings: 234,
          is_active: true
        },
        'exp-2': {
          id: 'exp-2',
          title: 'Japanese Tea Ceremony Experience',
          description: 'Learn the ancient art of Japanese tea ceremony in an authentic virtual setting. Kenji will guide you through the traditional steps, share the philosophy behind each movement, and help you understand the spiritual significance of this beautiful practice.',
          creator_id: 'demo-2',
          price_usd: 28,
          duration_minutes: 75,
          max_participants: 8,
          location: 'Kyoto, Japan (Virtual)',
          category: 'Cultural',
          experience_type: 'cooking_class',
          difficulty_level: 'beginner',
          language: 'English',
          image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
          requirements: 'Basic tea set (provided shopping list), quiet space',
          included_items: 'Tea ceremony guide, equipment list, follow-up resources',
          rating: 4.9,
          total_bookings: 156,
          is_active: true
        },
        'exp-3': {
          id: 'exp-3',
          title: 'Machu Picchu Archaeological Deep Dive',
          description: 'Join Dr. Maria Garcia for an in-depth exploration of Machu Picchu\'s mysteries. Using latest archaeological findings and 3D models, discover how the Incas built this incredible citadel and what recent excavations have revealed.',
          creator_id: 'demo-3',
          price_usd: 42,
          duration_minutes: 120,
          max_participants: 20,
          location: 'Machu Picchu, Peru (Virtual)',
          category: 'Archaeology',
          experience_type: 'educational',
          difficulty_level: 'intermediate',
          language: 'English',
          image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
          requirements: 'Interest in archaeology, notebook for taking notes',
          included_items: '3D model access, research papers, certificate of completion',
          rating: 4.9,
          total_bookings: 189,
          is_active: true
        }
      };

      const demoCreators = {
        'demo-1': {
          id: 'demo-1',
          full_name: 'Elena Rossi',
          bio: 'Passionate art historian with 15 years of experience guiding visitors through Europe\'s greatest museums.',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
          verification_status: 'verified',
          specialties: ['Art History', 'Museums', 'Renaissance'],
          location: 'Rome, Italy',
          experience_years: 15,
          service_rating: 4.7,
          service_rating_count: 234
        },
        'demo-2': {
          id: 'demo-2',
          full_name: 'Kenji Tanaka',
          bio: 'Born and raised in Kyoto, sharing the secrets of traditional Japanese culture for over a decade.',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          verification_status: 'verified',
          specialties: ['Japanese Culture', 'Temples', 'Food Tours'],
          location: 'Kyoto, Japan',
          experience_years: 12,
          service_rating: 4.6,
          service_rating_count: 189
        },
        'demo-3': {
          id: 'demo-3',
          full_name: 'Dr. Maria Garcia',
          bio: 'Archaeological researcher turned tour guide with expertise in ancient civilizations.',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          verification_status: 'verified',
          specialties: ['Archaeology', 'Ancient History', 'Inca Culture'],
          location: 'Cusco, Peru',
          experience_years: 18,
          service_rating: 4.8,
          service_rating_count: 320
        }
      };

      const experience = demoExperiences[experienceId as keyof typeof demoExperiences];
      const creator = demoCreators[experience?.creator_id as keyof typeof demoCreators];

      if (experience && creator) {
        setExperience(experience);
        setCreator(creator);
        
        // Demo reviews
        setReviews([
          {
            id: '1',
            user_name: 'Sarah M.',
            rating: 5,
            comment: 'Absolutely incredible experience! Elena\'s knowledge is amazing and she made the Vatican come alive.',
            created_at: '2024-03-15'
          },
          {
            id: '2',
            user_name: 'John D.',
            rating: 5,
            comment: 'Worth every penny. Learned so much about art history in such an engaging way.',
            created_at: '2024-03-10'
          }
        ]);
      } else {
        toast({
          variant: "destructive",
          title: "Experience not found",
          description: "The experience you're looking for doesn't exist.",
        });
        navigate('/experiences');
      }
    } catch (error) {
      console.error('Error fetching experience:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load experience details.",
      });
    } finally {
      setLoading(false);
      // Track experience view
      if (experienceId) {
        trackEngagement('view', experienceId, {
          metadata: { location: experience?.location }
        });
      }
    }
  };

  const formatPrice = (price: number) => `$${price}`;
  const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const getExperienceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      virtual_tour: 'Virtual Tour',
      cooking_class: 'Cooking Class',
      educational: 'Educational',
      workshop: 'Workshop'
    };
    return labels[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience || !creator) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Experience not found</h1>
            <Button onClick={() => navigate('/experiences')} className="mt-4">
              Back to Experiences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
          <img 
            src={experience.image_url} 
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-end">
            <div className="p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(experience.difficulty_level)}>
                  {experience.difficulty_level}
                </Badge>
                <Badge variant="secondary">{getExperienceTypeLabel(experience.experience_type)}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{experience.title}</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {experience.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(experience.duration_minutes)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Max {experience.max_participants} participants
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="creator">Creator</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {experience.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {experience.included_items}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {experience.requirements}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="creator" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                        <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{creator.full_name}</h3>
                          {creator.verification_status === 'verified' && (
                            <Shield className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span className="font-medium">{creator.service_rating}</span>
                          <span className="text-muted-foreground">({creator.service_rating_count} reviews)</span>
                        </div>
                        <p className="text-muted-foreground mb-4">{creator.bio}</p>
                        <div className="flex flex-wrap gap-2">
                          {creator.specialties?.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/creator/${creator.id}`)}
                          >
                            View Profile
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews ({reviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.user_name}</span>
                          <div className="flex items-center">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{review.created_at}</span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Experience Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Duration</p>
                        <p className="text-muted-foreground">{formatDuration(experience.duration_minutes)}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Max Participants</p>
                        <p className="text-muted-foreground">{experience.max_participants} people</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Language</p>
                        <p className="text-muted-foreground">{experience.language}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Category</p>
                        <p className="text-muted-foreground">{experience.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ExperienceBooking 
                experience={experience}
                onBookingComplete={() => {
                  toast({
                    title: "Booking Successful!",
                    description: "You'll receive a confirmation email shortly.",
                  });
                  navigate('/experiences');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetail;