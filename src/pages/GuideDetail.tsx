import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { EnhancedAudioPlayer } from "@/components/EnhancedAudioPlayer";
import { GuideLanguageSelector } from "@/components/GuideLanguageSelector";
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
import { Star, MapPin, Clock, Users, Play, Download, Share2, Bookmark, ChevronLeft, Lock, Copy, QrCode, Check, Link, ShoppingCart } from "lucide-react";
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
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { trackEngagement } = useViralTracking();
  const [searchParams] = useSearchParams();
  
  // Get preview data from navigation state for instant rendering
  const guidePreview = (location.state as any)?.guidePreview;
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [playingGuide, setPlayingGuide] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(!guidePreview);
  const [realGuideData, setRealGuideData] = useState<any>(guidePreview ? {
    id: guidePreview.id,
    slug: guidePreview.slug,
    title: guidePreview.title,
    description: guidePreview.description,
    location: guidePreview.location,
    price_usd: guidePreview.price,
    price: `$${(guidePreview.price / 100).toFixed(2)}`,
    duration: guidePreview.duration,
    category: guidePreview.category,
    difficulty: guidePreview.difficulty,
    image_url: guidePreview.imageUrl,
    image_urls: guidePreview.imageUrl ? [guidePreview.imageUrl] : [],
    creator: { name: 'Loading...', avatar: '', bio: '' },
    features: [],
    sections: [],
    languages: [],
  } : null);
  const [error, setError] = useState<string | null>(null);
  const [relatedGuides, setRelatedGuides] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [guideSections, setGuideSections] = useState<any[]>([]);
  const [linkedGuides, setLinkedGuides] = useState<any[]>([]);
  const [currentAccessCode, setCurrentAccessCode] = useState<string | null>(null);
  const { toast: showToast } = useToast();

  // Use real guide data if available, with fallbacks for essential properties
  const guide = realGuideData ? {
    ...realGuideData,
    languages: realGuideData.languages || [],
    chapters: guideSections.length > 0 ? guideSections : (realGuideData.chapters || realGuideData.sections || []),
    highlights: realGuideData.highlights || [],
    included: realGuideData.included || realGuideData.features || [],
    creator: realGuideData.creator || {}
  } : null;

  // Get the current chapters based on language selection
  const currentChapters = guideSections.length > 0 ? guideSections : (guide?.chapters || guide?.sections || []);

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
    if (!slug) {
      setError('Invalid guide slug');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, get the guide data by slug
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (guideError) {
        console.error('Error fetching guide:', guideError);
        throw guideError;
      }

      if (!guideData) {
        console.error('Guide not found with slug:', slug);
        setError('Guide not found');
        return;
      }

      // Check if user is admin or creator
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Apply publication filters for non-admin users
      const isAdmin = profile?.role === 'admin';
      if (!isAdmin && (!guideData.is_published || !guideData.is_approved)) {
        console.error('Guide is not published or approved');
        setError('This guide is not available');
        return;
      }

      // Transform data to match expected format
      const transformedData = {
        ...guideData,
        creator: {
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
        price_usd: guideData.price_usd, // Source of truth (cents)
        price: `$${(guideData.price_usd / 100).toFixed(2)}`, // Formatted display
        currency: guideData.currency || 'usd',
        sections: guideData.sections ? (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) : []
      };
      
      
      setRealGuideData(transformedData);
      setError(null);
      
      // Fetch linked guides collection
      await fetchLinkedGuides(guideData.id);
      
      // Fetch related guides
      await fetchRelatedGuides(transformedData.category, transformedData.location, guideData.id);
      
      // Track guide view once data is loaded
      if (guideData.id) {
        try {
          trackEngagement('view', guideData.id, {
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

  const detectAndSetLanguage = async (guideId: string) => {
    try {
      const { data: languages, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: guideId });
      
      if (error) throw error;
      
      if (languages && languages.length > 0) {
        // ONLY auto-select if localStorage has a saved preference
        const savedLanguage = localStorage.getItem(`guide_lang_${slug}`);
        if (savedLanguage && languages.find((l: any) => l.language_code === savedLanguage)) {
          setSelectedLanguage(savedLanguage);
          await fetchGuideSections(guideId, savedLanguage);
          return;
        }
        
        // Otherwise, wait for user to select - no automatic selection
        console.log('Available languages:', languages.map((l: any) => l.language_code));
      } else {
        console.warn('No languages available for guide:', guideId);
      }
    } catch (err) {
      console.error('Error detecting languages:', err);
    }
  };

  const fetchGuideSections = async (guideId: string, languageCode: string) => {
    try {
      if (!languageCode) {
        console.log('No language code provided');
        return;
      }

      const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('guide_id', guideId)
        .eq('language_code', languageCode)
        .order('order_index');

      if (error) {
        console.error('Error fetching guide sections:', error);
        return;
      }

      setGuideSections(data || []);
    } catch (error) {
      console.error('Error fetching guide sections:', error);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    console.log('🔄 Language change requested:', languageCode);
    setGuideSections([]);
    setSelectedLanguage(languageCode);
    // Save language preference
    if (slug) {
      localStorage.setItem(`guide_lang_${slug}`, languageCode);
    }
    // Dispatch event for MultiTabAudioPlayer
    const event = new CustomEvent('changeGuideLanguage', {
      detail: { 
        guideId: realGuideData?.id, 
        languageCode 
      }
    });
    window.dispatchEvent(event);
    
    // Don't reset playingGuide to preserve player state
    if (realGuideData?.id) {
      await fetchGuideSections(realGuideData.id, languageCode);
    }
  };

  const fetchLinkedGuides = async (guideId: string) => {
    try {
      const { data: collection } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', guideId)
        .maybeSingle();

      if (collection?.linked_guides && Array.isArray(collection.linked_guides)) {
        const guideIds = collection.linked_guides.map((lg: any) => lg.guide_id);
        
        const { data: guides } = await supabase
          .from('audio_guides')
          .select('id, title, slug, master_access_code, image_url, image_urls')
          .in('id', guideIds)
          .eq('is_published', true)
          .eq('is_approved', true);

        if (guides && Array.isArray(guides)) {
          const enrichedGuides = collection.linked_guides.map((lg: any) => {
            const guideData = guides.find((g: any) => g.id === lg.guide_id);
            return {
              ...lg,
              title: guideData?.title,
              slug: guideData?.slug,
              master_access_code: guideData?.master_access_code,
              image_url: guideData?.image_urls?.[0] || guideData?.image_url
            };
          }).filter((g: any) => g.title);

          setLinkedGuides(enrichedGuides);
        }
      }
    } catch (error) {
      console.error('Error fetching linked guides:', error);
    }
  };

  const fetchRelatedGuides = async (category: string, location: string, currentGuideId: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select(`
          id, 
          slug,
          title, 
          price_usd, 
          rating, 
          image_url,
          image_urls,
          location
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
        slug: guide.slug,
        title: guide.title,
        location: guide.location,
        creator: 'Anonymous Creator',
        rating: guide.rating || 0,
        price: (guide.price_usd || 0) / 100,
        image: guide.image_urls?.[0] || guide.image_url || '/hero-audio-guide.jpg'
      })) || [];

      setRelatedGuides(transformedRelated);
    } catch (error) {
      console.error('Error fetching related guides:', error);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!guide?.id) return;

    const accessCode = searchParams.get('access') || searchParams.get('access_code');
    if (accessCode) {
      setCurrentAccessCode(accessCode);
      try {
        const { data: isValidAccess, error } = await supabase
          .rpc('verify_access_code_secure', {
            p_access_code: accessCode.trim(),
            p_guide_id: guide.id
          });

        if (isValidAccess && !error) {
          setHasAccessCode(true);
          setIsPurchased(true);
          return;
        }

        const { data: isValidMaster, error: masterError } = await supabase
          .rpc('verify_master_access_code', {
            p_guide_id: guide.id,
            p_access_code: accessCode.trim()
          });

        if (isValidMaster && !masterError) {
          setHasAccessCode(true);
          setIsPurchased(true);
          return;
        }
      } catch (error) {
        console.log('Access code validation failed:', error);
      }
    }

    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id, access_code')
          .eq('user_id', user.id)
          .eq('guide_id', guide.id)
          .maybeSingle();

        if (data) {
          setIsPurchased(true);
          setCurrentAccessCode(data.access_code);
        }
      } catch (error) {
        setIsPurchased(false);
      }
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (guide?.id && !isBookmarked) {
      trackEngagement('bookmark', guide.id, {
        metadata: { location: guide.location }
      });
    }
    showToast({
      title: isBookmarked ? "Removed from Library" : "Added to Library",
      description: isBookmarked ? "Guide removed from your bookmarks" : "Guide saved to your bookmarks",
    });
  };

  useEffect(() => {
    if (slug) {
      fetchGuideDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (realGuideData?.id) {
      detectAndSetLanguage(realGuideData.id);
      checkPurchaseStatus();
    }
  }, [realGuideData?.id, user]);

  useEffect(() => {
    const paymentSuccessParam = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    
    if (paymentSuccessParam === 'true' && sessionId) {
      handlePaymentSuccess(sessionId);
    }
  }, [searchParams]);

  // Check if URL has access parameter (for noindex)
  const hasAccessParam = searchParams.get('access');

  // Check for guide updates and refresh if needed
  useEffect(() => {
    if (realGuideData?.id) {
      const lastUpdate = localStorage.getItem(`guide_updated_${realGuideData.id}`);
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const guideUpdateTime = new Date(realGuideData.updated_at).getTime();
        
        // If the stored update time is newer than the loaded guide data, refresh
        if (updateTime > guideUpdateTime) {
          fetchGuideDetails();
          localStorage.removeItem(`guide_updated_${realGuideData.id}`);
        }
      }
    }
  }, [realGuideData?.id, realGuideData?.updated_at]);



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
              <Button onClick={() => navigate('/guides')}>
                Browse Other Guides
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create structured data for the guide
  const guideStructuredData = guide ? [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://guided-sound-ai.lovable.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Guides",
          "item": "https://guided-sound-ai.lovable.app/guides"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": guide.title,
          "item": `https://guided-sound-ai.lovable.app/guide/${slug}`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": guide.title,
      "description": guide.description,
      "image": guide.image_urls?.[0] || guide.image_url || guide.image,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": guide.location?.split(',')[0] || guide.location,
        "addressCountry": guide.location?.split(',').pop()?.trim() || ""
      },
      "offers": guide.price_usd ? {
        "@type": "Offer",
        "price": (guide.price_usd / 100).toFixed(2),
        "priceCurrency": "USD"
      } : undefined,
      "aggregateRating": guide.rating ? {
        "@type": "AggregateRating",
        "ratingValue": guide.rating,
        "reviewCount": guide.total_reviews || guide.totalReviews || 0
      } : undefined
    }
  ] : undefined;

  return (
    <div className="min-h-screen bg-background">
      {guide && (
        <SEO 
          title={guide.title}
          description={guide.description?.substring(0, 160) || `Discover ${guide.title} with our immersive audio guide`}
          canonicalUrl={`https://guided-sound-ai.lovable.app/guide/${slug}`}
          image={guide.image_urls?.[0] || guide.image_url || guide.image}
          type="article"
          structuredData={guideStructuredData}
          noindex={!!hasAccessParam}
        />
      )}
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
                <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/guides')}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Guides
                </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image - Responsive aspect ratio */}
            <div className="relative aspect-video md:aspect-[16/10] rounded-3xl overflow-hidden shadow-xl">
              <img
                src={
                  (guide.image_urls?.[0] || guide.image_url)?.startsWith('data:image') 
                    ? (guide.image_urls?.[0] || guide.image_url)
                    : (guide.image_urls?.[0] || guide.image_url) || guide.image || '/hero-audio-guide.jpg'
                } 
                alt={guide.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/hero-audio-guide.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <Badge className="mb-2 text-sm px-3 py-1.5">{guide.category}</Badge>
                <h1 className="ios-title-large md:text-3xl font-bold text-shadow">{guide.title}</h1>
              </div>
            </div>

            {/* Guide Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  {/* Top Row: Location, Duration, Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="truncate max-w-[120px] md:max-w-none">{guide.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {Math.floor(guide.duration / 60)} min
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

                  {/* Language Selector - Full Width on Mobile */}
                  {guide?.id && (
                    <div className="w-full">
                      <GuideLanguageSelector
                        guideId={guide.id}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={handleLanguageChange}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </CardContent>
            </Card>

            {/* Already Purchased Banner */}
            {isPurchased && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        You Own This Guide
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Full access to all chapters and features
                      </p>
                    </div>
                    {currentAccessCode && (
                      <Button 
                        variant="outline" 
                        className="border-green-300 dark:border-green-700"
                        onClick={() => {
                          const accessLink = `/access/${guide?.id}?access_code=${currentAccessCode}`;
                          navigator.clipboard.writeText(window.location.origin + accessLink);
                          toast.success("Access link copied!");
                        }}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Copy Access Link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs Content - Responsive sizing */}
            <Tabs defaultValue="chapters" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10 md:h-11">
                <TabsTrigger value="chapters" className="text-xs md:text-sm">Chapters</TabsTrigger>
                <TabsTrigger value="qrcode" className="text-xs md:text-sm">QR Code</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs md:text-sm">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-3 md:space-y-4">
                {isPurchased || hasAccessCode ? (
                  <div className="space-y-2 md:space-y-3">
                    {currentChapters.map((chapter, index) => (
                      <Card key={index} className="p-3 md:p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs md:text-sm font-medium shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm md:text-base truncate">{chapter.title}</h4>
                              <p className="text-xs md:text-sm text-muted-foreground">
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
                            selectedLanguage={selectedLanguage}
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
                    
                    <div className="space-y-2 mb-4">
                      {currentChapters.slice(0, 3).map((chapter, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2.5 md:p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs md:text-sm truncate">{chapter.title}</h4>
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
                            selectedLanguage={selectedLanguage}
                          />
                        </div>
                      ))}
                      {currentChapters.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{currentChapters.length - 3} more chapters available
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
                                {window.location.origin}/guide/{guide.slug || guide.id}{searchParams.get('access_code') ? `?access_code=${searchParams.get('access_code')}` : ''}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(
                                  `${window.location.origin}/guide/${guide.slug || guide.id}${searchParams.get('access_code') ? `?access_code=${searchParams.get('access_code')}` : ''}`,
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

            {/* Enhanced Audio Player - Sticky on mobile, normal on desktop */}
            {(isPurchased || hasAccessCode) && (
              <div className="mt-8 md:relative md:mt-8">
                {/* Mobile: Fixed to bottom with safe area */}
                <div className="fixed bottom-0 left-0 right-0 z-40 md:relative md:z-auto bg-background border-t md:border-0 pb-safe md:pb-0">
                  <EnhancedAudioPlayer
                    guide={{
                      id: guide.id,
                      title: guide.title,
                      description: guide.description,
                      audio_url: guide.audio_url || guide.audioUrl,
                      image_url: guide.image_url
                    }}
                    sections={currentChapters}
                    accessCode={searchParams.get('access_code') || undefined}
                    selectedLanguage={selectedLanguage}
                    defaultStyle="spotify"
                  />
                </div>
                {/* Spacer to prevent content from being hidden under fixed player on mobile */}
                <div className="h-24 md:hidden" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile when player is active */}
          <div className="space-y-6">
            {/* Purchase Card - Compact on mobile */}
            <Card>
              <CardContent className="space-y-3 pt-4 md:pt-6 px-4 md:px-6">
                {isPurchased ? (
                  <Button className="w-full" size="lg" disabled>
                    <Check className="w-5 h-5 mr-2" />
                    Already Purchased
                  </Button>
                ) : (
                  <EmbeddedCheckout
                    guide={{
                      id: guide.id,
                      title: guide.title,
                      price_usd: guide.price_usd,
                      creator_name: guide.creator?.name !== 'Anonymous Creator' ? guide.creator?.name : undefined,
                      image_url: guide.image_url
                    }}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPaymentModal(false)}
                  />
                )}
               </CardContent>
             </Card>


            {/* Linked Guides Collection */}
            {linkedGuides.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Additional Guides in Collection
                  </CardTitle>
                  <CardDescription>
                    These guides are included with your purchase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedGuides.map((linkedGuide) => (
                    <Card key={linkedGuide.guide_id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex gap-3 p-3">
                        {linkedGuide.image_url && (
                          <img 
                            src={linkedGuide.image_url} 
                            alt={linkedGuide.custom_title || linkedGuide.title}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {linkedGuide.custom_title || linkedGuide.title}
                          </h4>
                          {isPurchased && linkedGuide.master_access_code && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-xs"
                              onClick={() => {
                                const accessUrl = `/access/${linkedGuide.guide_id}?access_code=${linkedGuide.master_access_code}`;
                                navigate(accessUrl);
                              }}
                            >
                              Listen Now →
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Guides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedGuides.map((relatedGuide) => (
                    <div 
                      key={relatedGuide.id} 
                      className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/guide/${relatedGuide.slug || relatedGuide.id}`)}
                    >
                      <img 
                        src={relatedGuide.image} 
                        alt={`${relatedGuide.title} - Audio guide in ${relatedGuide.location || 'destination'}`}
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
            )}
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