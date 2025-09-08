import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";

import { ReviewsSection } from "@/components/ReviewsSection";
import { EmbeddedCheckout } from "@/components/EmbeddedCheckout";
import { StripeConfigHelper } from "@/components/StripeConfigHelper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, MapPin, Clock, Users, Play, Download, Share2, Bookmark, ChevronLeft, Lock, Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChapterPreviewButton } from "@/components/ChapterPreviewButton";
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

// Related guides will be fetched dynamically

const GuideDetail = () => {
  console.log('🔧 GuideDetail component loading');
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
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realGuideData, setRealGuideData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [relatedGuides, setRelatedGuides] = useState<any[]>([]);
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

  // No global audio player - each chapter will manage its own

  const handlePurchase = () => {
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

  const handlePaymentSuccess = (sessionId?: string) => {
    console.log('🔧 [SUCCESS] Payment success handler called with sessionId:', sessionId);
    setIsPurchased(true);
    setShowPaymentModal(false);
    setPaymentSuccess(true);
    setShowQRCode(true); // Auto-open QR code
    
    checkPurchaseStatus();
    fetchGuideDetails(); // Refresh guide data
    
    showToast({
      title: "Payment Successful!",
      description: "Your audio guide has been purchased. Check your email for confirmation.",
    });

    // Clean up URL parameters if coming from redirect
    if (sessionId) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const fetchGuideDetails = async () => {
    if (!guideId) {
      setError('Invalid guide ID');
      setIsLoading(false);
      return;
    }

    // Validate guide ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guideId)) {
      console.error('Invalid guide ID format:', guideId);
      setError('Invalid guide ID format');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
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
        duration: guideData.duration,
        // Keep both formatted price for display AND original price_usd for payment
        price: `$${(guideData.price_usd / 100).toFixed(2)}`,
        price_usd: guideData.price_usd, // Preserve original price_usd as number for payment
        sections: guideData.sections ? (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) : []
      };
      
      
      setRealGuideData(transformedData);
      setError(null);
      
      // Fetch related guides
      await fetchRelatedGuides(transformedData.category, transformedData.location, guideId);
      
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

  const fetchRelatedGuides = async (category: string, location: string, currentGuideId: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select(`
          id, 
          title, 
          price_usd, 
          rating, 
          image_url, 
          location, 
          creator_id,
          profiles!creator_id(full_name)
        `)
        .neq('id', currentGuideId)
        .eq('is_published', true)
        .eq('is_approved', true)
        .or(`category.eq.${category},location.ilike.%${location.split(',')[0]}%`)
        .limit(2);

      if (error) {
        console.error('Error fetching related guides:', error);
        return;
      }

      const transformedRelated = data?.map(guide => ({
        id: guide.id,
        title: guide.title,
        creator: (guide.profiles as any)?.full_name || 'Anonymous Creator',
        rating: guide.rating || 0,
        price: Math.floor((guide.price_usd || 0) / 100),
        image: guide.image_url?.startsWith('data:image') ? guide.image_url : guide.image_url || '/hero-audio-guide.jpg'
      })) || [];

      setRelatedGuides(transformedRelated);
    } catch (error) {
      console.error('Error fetching related guides:', error);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!guideId) return;

    // Check for access code in URL (for guest users)
    const accessCode = searchParams.get('access') || searchParams.get('access_code');
    if (accessCode) {
      try {
        // Use secure function to verify access code without exposing guest emails
        const { data: isValidAccess, error } = await supabase
          .rpc('verify_access_code_secure', {
            p_access_code: accessCode.trim(),
            p_guide_id: guideId
          });

        if (isValidAccess && !error) {
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
          .select('id, access_code')
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
    
    // Check for payment success parameters
    const paymentSuccessParam = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    
    if (paymentSuccessParam === 'true' && sessionId) {
      handlePaymentSuccess(sessionId);
    }
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
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/search')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Guides
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img 
                src={
                  guide.image_url?.startsWith('data:image') 
                    ? guide.image_url 
                    : guide.image_url || guide.image || '/hero-audio-guide.jpg'
                } 
                alt={guide.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/hero-audio-guide.jpg';
                }}
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
                        {Math.floor(guide.duration / 60)} min
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
                <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-4">
                {isPurchased || hasAccessCode ? (
                  <div className="space-y-3">
                    {(guide.chapters || guide.sections || []).map((chapter, index) => (
                      <Card key={index} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{chapter.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {chapter.duration_seconds 
                                  ? `${Math.floor(chapter.duration_seconds / 60)}:${(chapter.duration_seconds % 60).toString().padStart(2, '0')}`
                                  : chapter.duration 
                                    ? `${Math.floor(chapter.duration / 60)}:${((chapter.duration * 60) % 60).toString().padStart(2, '0')}`
                                    : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                          <ChapterPreviewButton 
                            chapter={chapter}
                            index={index}
                            guide={guide}
                            isPurchased={isPurchased}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Chapters Locked</h3>
                        <p className="text-sm text-muted-foreground">
                          Full access requires purchase
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {(guide.chapters || guide.sections || []).slice(0, 3).map((chapter, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{chapter.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {chapter.duration_seconds 
                                  ? `${Math.floor(chapter.duration_seconds / 60)}:${(chapter.duration_seconds % 60).toString().padStart(2, '0')}`
                                  : chapter.duration 
                                    ? `${Math.floor(chapter.duration / 60)}:${((chapter.duration * 60) % 60).toString().padStart(2, '0')}`
                                    : 'N/A'
                                } min
                              </p>
                            </div>
                          </div>
                          <ChapterPreviewButton 
                            chapter={chapter}
                            index={index}
                            guide={guide}
                            isPurchased={isPurchased}
                          />
                        </div>
                      ))}
                      {(guide.chapters || guide.sections || []).length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{(guide.chapters || guide.sections || []).length - 3} more chapters available
                        </p>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        → Purchase the full guide in the sidebar for complete access
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="qrcode" className="space-y-4">
                <Card className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <QrCode className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">QR Code Access</h3>
                    </div>
                    
                    {isPurchased || showQRCode ? (
                      <div className="space-y-4">
                        {guide.qr_code_url && (
                          <div className="flex justify-center">
                            <div className="inline-block p-6 bg-white rounded-xl border-2 border-border shadow-sm">
                              <img 
                                src={guide.qr_code_url} 
                                alt="QR Code for guide access"
                                className="w-48 h-48 mx-auto"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Scan this QR code to access your audio guide on any device
                          </p>
                          
                          {(paymentSuccess || searchParams.get('access_code')) && (
                            <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <label className="text-sm font-medium text-green-700 dark:text-green-300">Your Access Code</label>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-md border border-green-200 dark:border-green-700 text-lg font-mono text-center">
                                  {searchParams.get('access_code') || 'Loading...'}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(searchParams.get('access_code') || '', 'Access code')}
                                  className="border-green-200 dark:border-green-700"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Save this code - you'll need it to access your audio guide
                              </p>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Share Link</label>
                            <div className="flex gap-2">
                              <div className="flex-1 p-3 bg-muted rounded-md text-sm font-mono truncate">
                                {window.location.origin}/guide/{guide.id}{searchParams.get('access_code') ? `?access_code=${searchParams.get('access_code')}` : ''}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(
                                  `${window.location.origin}/guide/${guide.id}${searchParams.get('access_code') ? `?access_code=${searchParams.get('access_code')}` : ''}`,
                                  'Share link'
                                )}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="inline-block p-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                          <div className="relative">
                            <QrCode className="w-32 h-32 mx-auto text-muted-foreground/20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-12 h-12 text-muted-foreground/50" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="text-lg font-medium">QR Code Locked</h4>
                          <p className="text-muted-foreground">
                            Purchase this guide to unlock your personal QR code for easy access and sharing
                          </p>
                          
                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              Access your guide on any device
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              Share with friends and family
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              No internet required after download
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              → Purchase the full guide in the sidebar to unlock QR code
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                <ReviewsSection guideId={guide.id} isPurchased={isPurchased} showAllReviews={true} />
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
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Available for immediate purchase - no account required
                        </span>
                      </div>
                    </>
                  )}
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


      {/* Enhanced Payment Modal with Force Reset */}
      <Dialog 
        key={`payment-modal-${showPaymentModal}`} 
        open={showPaymentModal} 
        onOpenChange={(open) => {
          console.log('🔧 [MODAL] State change:', { from: showPaymentModal, to: open });
          setShowPaymentModal(open);
          
          // Force cleanup when closing
          if (!open) {
            setTimeout(() => {
              console.log('🔧 [MODAL] Cleanup timeout executed');
            }, 100);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onOpenAutoFocus={(e) => {
            const userAgent = navigator.userAgent;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const browserName = userAgent.includes('Chrome') ? 'Chrome' : 
                              userAgent.includes('Firefox') ? 'Firefox' : 
                              userAgent.includes('Safari') ? 'Safari' : 
                              userAgent.includes('Edge') ? 'Edge' : 'Unknown';
            
            console.log('🔧 [MODAL DEBUG] Dialog opened:', {
              userAgent,
              browserName,
              isMobile,
              modalState: showPaymentModal,
              timestamp: new Date().toISOString(),
              realGuideData: realGuideData ? {
                id: realGuideData.id,
                title: realGuideData.title,
                price_usd: realGuideData.price_usd,
                creator: realGuideData.creator
              } : null
            });
          }}
          onEscapeKeyDown={() => {
            console.log('🔧 [MODAL] Escape key pressed - force close');
            setShowPaymentModal(false);
          }}
          onPointerDownOutside={() => {
            console.log('🔧 [MODAL] Click outside - force close');
            setShowPaymentModal(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>
          {realGuideData && (
            <EmbeddedCheckout
              key={`checkout-${showPaymentModal}-${Date.now()}`} // Force re-render
              guide={{
                id: realGuideData.id,
                title: realGuideData.title,
                price_usd: realGuideData.price_usd,
                creator_name: realGuideData.creator?.name,
                image_url: realGuideData.image_url
              }}
              onSuccess={() => {
                console.log('🔧 [MODAL] Payment success callback triggered');
                setShowPaymentModal(false);
                handlePaymentSuccess();
              }}
              onCancel={() => {
                console.log('🔧 [MODAL] Payment cancel callback triggered');
                setShowPaymentModal(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuideDetail;