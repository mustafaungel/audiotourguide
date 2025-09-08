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
import { supabase } from '@/integrations/supabase/client';

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
      // Fetch real experience data
      const { data: experienceData, error: experienceError } = await supabase
        .from('live_experiences')
        .select('*')
        .eq('id', experienceId)
        .eq('is_active', true)
        .single();

      if (experienceError || !experienceData) {
        toast({
          variant: "destructive",
          title: "Experience not found",
          description: "The experience you're looking for doesn't exist.",
        });
        navigate('/experiences');
        return;
      }

      setExperience(experienceData);

      // Fetch creator data
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', experienceData.creator_id)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
      } else {
        setCreator(creatorData);
      }

      // Fetch real reviews - leave empty for now as table structure needs adjustment
      setReviews([]);
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