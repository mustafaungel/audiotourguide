import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import { SocialShare } from "@/components/SocialShare";
import { GuestCheckout } from "@/components/GuestCheckout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, Users, Play, Download, Share2, Bookmark, ChevronLeft, Lock, Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Demo guide data
const guideData = {
  "machu-picchu-complete": {
    id: "1",
    title: "Machu Picchu: Complete Historical Journey",
    description: "Embark on a comprehensive exploration of the Lost City of the Incas. This immersive audio guide reveals the mysteries, engineering marvels, and spiritual significance of this ancient citadel.",
    location: "Machu Picchu, Peru",
    duration: 120,
    rating: 4.9,
    totalReviews: 234,
    price: 12,
    currency: "USD",
    image: "/src/assets/machu-picchu.jpg",
    audioUrl: "/public/tmp/guide1.mp3",
    category: "Historical",
    difficulty: "Easy",
    languages: ["English", "Spanish", "Quechua"],
    creator: {
      id: "creator1",
      name: "Dr. Maria Santos",
      avatar: "/src/assets/guide-museum.jpg",
      title: "Archaeological Expert",
      rating: 4.8,
      guides: 12,
      verified: true
    },
    chapters: [
      { title: "Welcome to Machu Picchu", duration: 8, timestamp: 0 },
      { title: "The Discovery Story", duration: 12, timestamp: 480 },
      { title: "Inca Engineering Marvels", duration: 15, timestamp: 1200 },
      { title: "Sacred Spaces & Temples", duration: 18, timestamp: 2100 },
      { title: "Daily Life in the Citadel", duration: 14, timestamp: 3180 },
      { title: "Mysteries Yet Unsolved", duration: 16, timestamp: 4020 },
      { title: "Conservation Efforts", duration: 11, timestamp: 4980 },
      { title: "Your Journey Continues", duration: 6, timestamp: 5640 }
    ],
    highlights: [
      "Explore the Intihuatana Stone",
      "Discover the Temple of the Sun", 
      "Learn about Inca astronomy",
      "Understand the agricultural terraces"
    ],
    included: [
      "2-hour premium audio guide",
      "Interactive map with GPS",
      "Downloadable transcript",
      "Photo spots recommendations"
    ]
  }
};

const reviews = [
  {
    id: 1,
    user: "Sarah M.",
    rating: 5,
    comment: "Absolutely incredible! Dr. Santos brought Machu Picchu to life with fascinating historical details and perfect pacing.",
    date: "2 days ago",
    verified: true
  },
  {
    id: 2, 
    user: "Michael R.",
    rating: 5,
    comment: "Best audio guide I've ever used. The storytelling made me feel like I was walking with the Incas themselves.",
    date: "1 week ago",
    verified: true
  },
  {
    id: 3,
    user: "Ana L.",
    rating: 4,
    comment: "Great content and very informative. Would love more guides from this creator!",
    date: "2 weeks ago", 
    verified: false
  }
];

const relatedGuides = [
  {
    id: "2",
    title: "Sacred Valley Explorer",
    creator: "Carlos Mendoza",
    rating: 4.7,
    price: 8,
    image: "/src/assets/kyoto-temple.jpg"
  },
  {
    id: "3", 
    title: "Cusco: Heart of the Inca Empire",
    creator: "Dr. Maria Santos",
    rating: 4.8,
    price: 10,
    image: "/src/assets/cappadocia-goreme.jpg"
  }
];

const GuideDetail = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEngagement } = useViralTracking();
  const [searchParams] = useSearchParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [playingGuide, setPlayingGuide] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realGuideData, setRealGuideData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast: showToast } = useToast();

  // Use real guide data if available, with fallbacks for essential properties
  const guide = realGuideData ? {
    ...realGuideData,
    languages: realGuideData.languages || [],
    chapters: realGuideData.chapters || realGuideData.sections || [],
    highlights: realGuideData.highlights || [],
    included: realGuideData.included || realGuideData.features || [],
    creator: realGuideData.creator || {}
  } : null;

  console.log('Guide data state:', {
    isLoading,
    error,
    realGuideData: !!realGuideData,
    guide: !!guide,
    guideTitle: guide?.title
  });

  const handlePurchase = () => {
    if (!user) {
      showToast({
        title: "Sign in required",
        description: "Please sign in to purchase audio guides."
      });
      navigate('/auth');
      return;
    }
    
    setShowPaymentModal(true);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (err) {
      toast.error(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPurchased(true);
    setShowPaymentModal(false);
    checkPurchaseStatus();
  };

  const fetchGuideDetails = async () => {
    if (!guideId) return;
    
    setIsLoading(true);
    console.log('Fetching guide details for:', guideId);
    
    try {
      // First, get the guide data
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('id', guideId)
        .maybeSingle();

      if (guideError) {
        console.error('Error fetching guide:', guideError);
        throw guideError;
      }

      if (!guideData) {
        console.error('Guide not found with ID:', guideId);
        setError('Guide not found');
        return;
      }

      // Check if user is admin or creator
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Apply publication filters for non-admin/non-creator users
      const isAdminOrCreator = profile?.role === 'admin' || user?.id === guideData.creator_id;
      if (!isAdminOrCreator && (!guideData.is_published || !guideData.is_approved)) {
        console.error('Guide is not published or approved');
        setError('This guide is not available');
        return;
      }

      // Get creator profile separately for better reliability
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio')
        .eq('user_id', guideData.creator_id)
        .maybeSingle();

      // Transform data to match expected format
      const transformedData = {
        ...guideData,
        creator: creatorProfile ? {
          name: creatorProfile.full_name || 'Anonymous Creator',
          avatar: creatorProfile.avatar_url || '',
          bio: creatorProfile.bio || ''
        } : {
          name: 'Anonymous Creator',
          avatar: '',
          bio: ''
        },
        features: [
          'High-quality audio narration',
          'Interactive content',
          'Offline access',
          'Multiple languages available'
        ],
        duration: `${Math.floor(guideData.duration / 60)} min`,
        price: `$${(guideData.price_usd / 100).toFixed(2)}`,
        sections: guideData.sections ? (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) : []
      };
      
      console.log('Successfully fetched guide data:', transformedData);
      setRealGuideData(transformedData);
      setError(null);
      
      // Track guide view once data is loaded
      if (guideId) {
        try {
          trackEngagement('view', guideId, {
            metadata: { location: transformedData.location }
          });
        } catch (trackError) {
          console.warn('Failed to track engagement:', trackError);
        }
      }
    } catch (error) {
      console.error('Error fetching guide details:', error);
      setError('Failed to load guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!guideId) return;

    // Check for access code in URL (for guest users)
    const accessCode = searchParams.get('access_code');
    if (accessCode) {
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id')
          .eq('guide_id', guideId)
          .eq('access_code', accessCode)
          .single();

        if (data && !error) {
          setHasAccessCode(true);
          setIsPurchased(true);
          return;
        }
      } catch (error) {
        console.log('Access code validation failed:', error);
      }
    }

    // Check for logged-in user purchases
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('guide_id', guideId)
          .single();

        if (data) {
          setIsPurchased(true);
        }
      } catch (error) {
        setIsPurchased(false);
      }
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (guideId && !isBookmarked) {
      trackEngagement('bookmark', guideId, {
        metadata: { location: guide.location }
      });
    }
    showToast({
      title: isBookmarked ? "Removed from Library" : "Added to Library",
      description: isBookmarked ? "Guide removed from your bookmarks" : "Guide saved to your bookmarks",
    });
  };

  useEffect(() => {
    fetchGuideDetails();
    checkPurchaseStatus();
  }, [guideId, user, searchParams]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: guide.title,
        text: guide.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({
        title: "Link Copied",
        description: "Guide link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Guides
          </Button>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading guide details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !guide || !guide.title) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Guides
          </Button>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Guide Not Found</h1>
              <p className="text-muted-foreground mb-4">
                {error || "The guide you're looking for doesn't exist or is not available."}
              </p>
              <Button onClick={() => navigate('/search')}>
                Browse Other Guides
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Guides
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img 
                src={guide.image} 
                alt={guide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <Badge className="mb-2">{guide.category}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold">{guide.title}</h1>
              </div>
            </div>

            {/* Guide Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {guide.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {guide.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {guide.rating} ({guide.totalReviews})
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{guide.difficulty}</Badge>
                      {(guide.languages || []).map(lang => (
                        <Badge key={lang} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBookmark}>
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs defaultValue="chapters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="highlights">Highlights</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-3">
                {(guide.chapters || guide.sections || []).map((chapter, index) => (
                  <Card key={index} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{chapter.title}</h4>
                          <p className="text-sm text-muted-foreground">{chapter.duration} minutes</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="highlights" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">What You'll Discover</h4>
                    <ul className="space-y-2">
                      {(guide.highlights || []).map((highlight, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">What's Included</h4>
                    <ul className="space-y-2">
                      {(guide.included || guide.features || []).map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                {(reviews || []).map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{review.user}</h5>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({length: review.rating || 0}).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {guide.price || '$0'} {guide.currency || 'USD'}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time purchase</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isPurchased ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => setPlayingGuide(true)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Audio Guide
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download for Offline
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" onClick={handlePurchase}>
                      Purchase Guide
                    </Button>
                    {!user && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Sign in to purchase and access guides
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* QR Code & Share Section */}
            {(guide.qr_code_url || guide.share_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    {isPurchased ? 'Share This Guide' : 'QR Code Access'}
                  </CardTitle>
                  <CardDescription>
                    {isPurchased 
                      ? 'Easy sharing options for this audio guide'
                      : 'Purchase this guide to unlock QR code sharing'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPurchased ? (
                    <>
                      {guide.qr_code_url && (
                        <div className="text-center">
                          <div className="inline-block p-4 bg-white rounded-lg border-2 border-border">
                            <img 
                              src={guide.qr_code_url} 
                              alt="QR Code for guide"
                              className="w-32 h-32 mx-auto"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Scan to share this guide
                          </p>
                        </div>
                      )}
                      
                      {guide.share_url && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Share Link</label>
                          <div className="flex gap-2">
                            <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono truncate">
                              {guide.share_url}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(guide.share_url, 'Share link')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="inline-block p-8 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                        <QrCode className="w-24 h-24 mx-auto text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          QR code will be available after purchase
                        </p>
                        <Button 
                          onClick={() => setShowPaymentModal(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Unlock QR Code
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Share */}
            <SocialShare
              title={`🎧 ${guide.title}`}
              description={`Discover ${guide.location} through this amazing ${guide.duration}-minute audio guide! ${guide.description}`}
              guide={{
                id: guide.id,
                title: guide.title,
                location: guide.location,
                image_url: guide.image
              }}
            />

            {/* Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle>Meet Your Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={guide.creator.avatar} />
                    <AvatarFallback>{guide.creator?.name?.split(' ').map(n => n[0]).join('') || 'CR'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{guide.creator.name}</h4>
                      {guide.creator.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{guide.creator.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {guide.creator.rating}
                  </div>
                  <div>{guide.creator.guides} guides</div>
                </div>
                
                <Button variant="outline" className="w-full" size="sm">
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Related Guides */}
            <Card>
              <CardHeader>
                <CardTitle>Related Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(relatedGuides || []).map((relatedGuide) => (
                  <div key={relatedGuide.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <img 
                      src={relatedGuide.image} 
                      alt={relatedGuide.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm line-clamp-2">{relatedGuide.title}</h5>
                      <p className="text-xs text-muted-foreground">{relatedGuide.creator}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{relatedGuide.rating}</span>
                        </div>
                        <span className="text-xs font-medium">${relatedGuide.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {playingGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t">
          <div className="container mx-auto">
            <AudioPlayer 
              title={guide.title}
              description={guide.description}
              guideId={guide.id}
            />
          </div>
        </div>
      )}

      {/* Payment Modal with Guest Checkout */}
      {showPaymentModal && realGuideData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 z-10"
              onClick={() => setShowPaymentModal(false)}
            >
              ×
            </Button>
            <GuestCheckout
              guide={{
                id: realGuideData.id,
                title: realGuideData.title,
                price_usd: realGuideData.price_usd,
                creator_name: realGuideData.creator?.name,
                image_url: realGuideData.image_url
              }}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDetail;