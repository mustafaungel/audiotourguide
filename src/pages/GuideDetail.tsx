import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
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
import { Star, MapPin, Clock, Users, Play, Download, Share2, Bookmark, ChevronLeft, Lock, Copy, Check, Link, Headphones, Globe } from "lucide-react";
import { getLanguageFlag, getLanguageName } from "@/lib/language-utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getMapEmbedUrl, parseCoordinates } from "@/lib/maps-utils";
import { getProxiedImageUrl } from "@/lib/url-utils";
import { LiveListenersBadge } from "@/components/LiveListenersBadge";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChapterPreviewButton } from "@/components/ChapterPreviewButton";
import { toast } from "sonner";


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
    creator: { name: '', avatar: '', bio: '' },
    features: [],
    sections: [],
    languages: [],
    is_featured: guidePreview.isFeatured || false,
  } : null);
  const [error, setError] = useState<string | null>(null);
  const [relatedGuides, setRelatedGuides] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [guideSections, setGuideSections] = useState<any[]>([]);
  const [linkedGuides, setLinkedGuides] = useState<any[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
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

  const isFeaturedGuide = realGuideData?.is_featured === true;

  // Get the current chapters based on language selection
  const currentChapters = guideSections.length > 0 ? guideSections : (guide?.chapters || guide?.sections || []);
  // Calculate duration from actual sections (language-specific)
  const sectionsDuration = currentChapters.reduce((sum: number, ch: any) => sum + (ch.duration_seconds || 0), 0);
  const displayDuration = sectionsDuration > 0 ? Math.floor(sectionsDuration / 60) : Math.floor((guide?.duration || 0) / 60);

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
    
    // Only show loading spinner if we don't have preview data
    if (!realGuideData) {
      setIsLoading(true);
    }
    
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
          name: 'Audio Tour Guides',
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
      
      // Fetch linked + related guides + approved reviews in parallel
      const [,, reviewsResult] = await Promise.all([
        fetchLinkedGuides(guideData.id),
        fetchRelatedGuides(transformedData.category, transformedData.location, guideData.id),
        supabase.from('public_guest_reviews').select('*').eq('guide_id', guideData.id).order('created_at', { ascending: false }),
      ]);
      if (reviewsResult.data) setApprovedReviews(reviewsResult.data);
      
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
        // Check localStorage for saved preference
        const savedLanguage = localStorage.getItem(`guide_lang_${slug}`);
        if (savedLanguage && languages.find((l: any) => l.language_code === savedLanguage)) {
          setSelectedLanguage(savedLanguage);
          await fetchGuideSections(guideId, savedLanguage);
          return;
        }

        // Auto-select first available language (fallback when default 'en' has no audio)
        const firstLang = languages[0].language_code;
        setSelectedLanguage(firstLang);
        await fetchGuideSections(guideId, firstLang);
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
    // Keep stale sections visible — don't clear before fetch
    setSelectedLanguage(languageCode);
    // Save language preference
    if (slug) {
      localStorage.setItem(`guide_lang_${slug}`, languageCode);
    }
    
    // Don't reset playingGuide to preserve player state
    // Fetch new sections — page owns main guide language data
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
        creator: 'Audio Tour Guides',
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Audio Themed Loading */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Image Area - Audio themed placeholder */}
              <div className="relative aspect-video md:aspect-[16/10] rounded-3xl overflow-hidden bg-muted min-h-[200px] md:min-h-[300px] flex items-center justify-center">
                <AudioGuideLoader variant="page" message="Preparing your audio experience..." />
              </div>
              {/* Guide Info Skeleton - themed */}
              <Card className="min-h-[120px]">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Sidebar Skeleton - Audio Themed */}
            <div className="space-y-6">
              <Card className="min-h-[200px]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center audio-icon-pulse">
                      <Headphones className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-12 w-full bg-primary/10 rounded-lg animate-pulse flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
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

  // SEO: Extract location parts
  const guideCity = guide?.location?.split(',')[0]?.trim() || '';
  const guideCountry = guide?.location?.split(',').pop()?.trim() || '';
  const guideImage = guide?.image_urls?.[0] || guide?.image_url || guide?.image;
  const guideImageSeo = getProxiedImageUrl(guideImage);
  const seoTitle = guide ? `${guide.title} in ${guide.location}` : '';

  // Hreflang links for multi-language guides
  const hreflangLinks = guide?.languages?.length > 1 ? guide.languages.map((lang: string) => {
    const langCode = lang === 'English' ? 'en' : lang === 'Spanish' ? 'es' : lang === 'French' ? 'fr' : lang === 'German' ? 'de' : lang === 'Italian' ? 'it' : lang === 'Portuguese' ? 'pt' : lang === 'Japanese' ? 'ja' : lang === 'Korean' ? 'ko' : lang === 'Chinese' ? 'zh' : lang === 'Russian' ? 'ru' : lang === 'Turkish' ? 'tr' : lang === 'Arabic' ? 'ar' : lang.substring(0, 2).toLowerCase();
    return { lang: langCode, url: `https://audiotourguide.app/guide/${slug}` };
  }) : undefined;

  // Create structured data for the guide
  const guideStructuredData = guide ? [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://audiotourguide.app" },
        { "@type": "ListItem", "position": 2, "name": "Guides", "item": "https://audiotourguide.app/guides" },
        ...(guideCountry ? [{ "@type": "ListItem", "position": 3, "name": `${guideCountry} Guides`, "item": `https://audiotourguide.app/country/${guideCountry.toLowerCase().replace(/\s+/g, '-')}` }] : []),
        { "@type": "ListItem", "position": guideCountry ? 4 : 3, "name": guide.title, "item": `https://audiotourguide.app/guide/${slug}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": guide.title,
      "description": guide.description,
      "image": guideImageSeo,
      "url": `https://audiotourguide.app/guide/${slug}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": guideCity,
        "addressCountry": guideCountry
      },
      ...(parseCoordinates(guide.maps_url) ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": parseCoordinates(guide.maps_url)!.lat,
          "longitude": parseCoordinates(guide.maps_url)!.lng
        }
      } : {}),
      ...(guide.languages?.length > 0 ? { "availableLanguage": guide.languages.map((l: string) => ({ "@type": "Language", "name": l })) } : {}),
      "offers": guide.price_usd ? {
        "@type": "Offer",
        "price": (guide.price_usd / 100).toFixed(2),
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      } : undefined,
      ...(approvedReviews.length > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": (approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length).toFixed(1),
          "reviewCount": approvedReviews.length,
          "bestRating": 5,
          "worstRating": 1
        },
        "review": approvedReviews.slice(0, 20).map((r: any) => ({
          "@type": "Review",
          "author": { "@type": "Person", "name": r.name || r.reviewer_name || 'Guest' },
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5 },
          "reviewBody": r.comment,
          "datePublished": r.created_at?.substring(0, 10)
        }))
      } : guide.rating ? {
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": guide.rating, "reviewCount": guide.total_reviews || 0 }
      } : {})
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${guide.title} Audio Guide`,
      "description": guide.description,
      "image": guideImageSeo,
      "brand": { "@type": "Brand", "name": "Audio Tour Guides" },
      "offers": {
        "@type": "Offer",
        "price": guide.price_usd ? (guide.price_usd / 100).toFixed(2) : "0.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      ...(approvedReviews.length > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": (approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length).toFixed(1),
          "reviewCount": approvedReviews.length
        }
      } : guide.rating ? {
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": guide.rating, "reviewCount": guide.total_reviews || 0 }
      } : {})
    }
  ] : undefined;

  return (
    <div className="min-h-screen bg-background">
      {guide && (
        <SEO
          title={seoTitle}
          description={guide.description || `Discover ${guide.title} with our immersive audio guide in ${guide.location}`}
          canonicalUrl={`https://audiotourguide.app/guide/${slug}`}
          image={guideImageSeo}
          type="article"
          structuredData={guideStructuredData}
          noindex={!!hasAccessParam}
          hreflangLinks={hreflangLinks}
          geoPlaceName={guideCity}
          geoRegion={guideCountry}
          geoPosition={(() => {
            const coords = parseCoordinates(guide.maps_url);
            return coords ? `${coords.lat};${coords.lng}` : undefined;
          })()}
        />
      )}
      <Navigation sticky={false} />
      
      {/* Sticky header — below navigation bar */}
      <div className={`sticky top-0 z-40 backdrop-blur-xl border-b px-3 py-2.5 ${isFeaturedGuide ? 'bg-amber-500/15 dark:bg-amber-900/40 border-amber-500/30' : 'bg-primary/5 dark:bg-primary/10 border-primary/25'}`}>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors active:scale-90 ${isFeaturedGuide ? 'bg-amber-500/15 hover:bg-amber-500/25' : 'bg-primary/15 hover:bg-primary/25'}`}>
            <ChevronLeft className={`w-[22px] h-[22px] ${isFeaturedGuide ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
          </button>
          <span className="text-sm font-bold font-heading min-w-0 line-clamp-2 leading-tight">{guide.title}</span>
          <span className="text-base ml-0.5 shrink-0">{getLanguageFlag(selectedLanguage)}</span>
        </div>
      </div>

      <div className="mobile-container py-4 pb-24">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Compact Header — image + info side by side */}
            <div className="mobile-surface-strong space-y-4 rounded-[28px] p-4 sm:p-5">
              {/* Image + Language flags side by side */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[24px] shadow-[var(--shadow-elevated)] sm:h-36 sm:w-36">
                  <OptimizedImage
                    src={guide.image_urls?.[0] || guide.image_url}
                    alt={`${guide.title} - Audio Guide`}
                    width={144}
                    height={144}
                    quality={80}
                    loading="eager"
                    className="w-full h-full object-cover object-center"
                  />
                  <Badge className={`absolute left-2 top-2 border-0 px-2 py-1 text-[10px] capitalize backdrop-blur-sm ${isFeaturedGuide ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-50' : 'bg-primary/85 text-primary-foreground'}`}>
                    {guide.category}
                  </Badge>
                  <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-[var(--shadow-card)] backdrop-blur-md">
                    <MapPin className="w-3 h-3 text-primary-foreground" fill="currentColor" />
                  </span>
                  <span className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1 rounded-xl bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                    <span className="break-words">{guide.location}</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="mobile-kicker">Audio guide</p>
                      <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">{guide.title}</h1>
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{guide.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
                        <Headphones className="h-3.5 w-3.5" /> {currentChapters.length} audio stops
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium text-secondary-foreground">
                        <Clock className="h-3.5 w-3.5" /> {displayDuration} min
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium text-secondary-foreground">
                        <Globe className="h-3.5 w-3.5" /> {guide.languages?.length || 1} languages
                      </span>
                    </div>
                  </div>

                  {guide?.id && (
                    <GuideLanguageSelector
                      guideId={guide.id}
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={handleLanguageChange}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[20px]">
              <LiveListenersBadge guideId={guide.id} size="compact" />
            </div>

            {/* Map link */}
            {guide.maps_url && (
              <a
                href={guide.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-surface flex items-center gap-3 rounded-[22px] p-3.5 transition-colors group hover:bg-muted/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">View on Google Maps</span>
                  <p className="text-xs text-muted-foreground truncate">{guide.location}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
              </a>
            )}

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
              <TabsList className="grid w-full grid-cols-2 h-11 md:h-12 p-1 bg-muted/50">
                <TabsTrigger value="chapters" className="text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-lg transition-all"><Headphones className="w-3.5 h-3.5 mr-1.5" />Chapters</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-lg transition-all">
                  <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-400 text-amber-400" />
                  {approvedReviews.length > 0 ? (
                    <span>{(approvedReviews.reduce((s: number, r: any) => s + r.rating, 0) / approvedReviews.length).toFixed(1)} Reviews ({approvedReviews.length})</span>
                  ) : (
                    <span>Reviews</span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-3 md:space-y-4">
                {isPurchased || hasAccessCode ? (
                  <div className="space-y-2 md:space-y-3">
                    {currentChapters.map((chapter, index) => (
                      <Card key={index} className="audio-card-glow rounded-[24px] border-border/30 bg-card/80 p-3 md:p-4 hover:bg-muted/50 cursor-pointer transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs md:text-sm font-bold text-primary shrink-0">
                              {index + 1}
                            </div>
                            {/* Mini waveform decoration */}
                            <div className="flex items-center gap-[2px] shrink-0 opacity-30">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="w-[2px] rounded-full bg-primary" style={{ height: `${8 + i * 4}px` }} />
                              ))}
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
                  <div className="space-y-2">
                    {/* Preview header — gradient card */}
                     <div className="rounded-[22px] border border-primary/20 bg-gradient-to-r from-primary/15 to-primary/5 p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Headphones className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">Try Before You Buy</h3>
                          <p className="text-[10px] text-muted-foreground">Listen to 30-second previews for free</p>
                        </div>
                      </div>
                    </div>

                    {/* Chapter list — full names */}
                    {currentChapters.slice(0, 3).map((chapter, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-[20px] border border-border/30 bg-card/70 p-3 shadow-[var(--shadow-card)]">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs leading-snug">{chapter.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {chapter.duration_seconds
                              ? `${Math.floor(chapter.duration_seconds / 60)}:${(chapter.duration_seconds % 60).toString().padStart(2, '0')}`
                              : 'N/A'
                            }
                          </p>
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
                      <p className="text-[11px] text-muted-foreground text-center py-1.5">
                        +{currentChapters.length - 3} more stops with full access
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              
              <TabsContent value="reviews" className="space-y-4">
                <ReviewsSection guideId={guide.id} isPurchased={isPurchased} showAllReviews={true} />
              </TabsContent>
            </Tabs>

            {/* Enhanced Audio Player - Sticky on mobile, normal on desktop */}
            {(isPurchased || hasAccessCode) && (
              <div className="mt-8 md:relative md:mt-8">
                {/* Now Playing Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Headphones className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Now Playing</span>
                  <div className="flex items-center gap-[2px] opacity-40">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-[2px] rounded-full bg-primary card-waveform-bar" style={{ height: `${6 + Math.sin(i * 0.8) * 5}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
                {/* Mobile: Fixed to bottom with safe area */}
                <div className="fixed bottom-0 left-0 right-0 z-40 md:relative md:z-auto bg-background border-t md:border-0 pb-safe md:pb-0 audio-card-glow md:rounded-2xl md:border md:border-border/30">
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Purchase — headphone themed */}
            <div className="mobile-surface-strong overflow-hidden rounded-[28px] border-amber-500/30 bg-amber-500/5">
              <div className="px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500">
                <Headphones className="w-4 h-4 text-amber-50" />
                <span className="text-xs font-bold tracking-wide uppercase text-amber-50">Get Full Access</span>
              </div>
              <div className="space-y-4 p-4">
                <div className="space-y-2 rounded-[22px] border border-border/30 bg-background/70 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="mobile-kicker text-amber-600 dark:text-amber-400">Premium access</p>
                      <p className="mt-1 text-2xl font-extrabold text-foreground">${((guide.price_usd || 0) / 100).toFixed(2)}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">One-time purchase</Badge>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />Full chapter access</div>
                    <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />Mobile listening ready</div>
                    <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />Return anytime from Library</div>
                  </div>
                </div>
                {isPurchased ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-amber-600">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold text-sm">Already Purchased</span>
                  </div>
                ) : (
                  <EmbeddedCheckout
                    guide={{
                      id: guide.id,
                      title: guide.title,
                      price_usd: guide.price_usd,
                      creator_name: guide.creator?.name !== 'Audio Tour Guides' ? guide.creator?.name : undefined,
                      image_url: guide.image_url
                    }}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPaymentModal(false)}
                  />
                )}
              </div>
            </div>

            {/* Linked Guides */}
            {linkedGuides.length > 0 && (
              <div className="mobile-surface overflow-hidden rounded-[24px]">
                <div className="px-4 py-3 border-b border-border/30">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    Also in This Collection
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {linkedGuides.map((linkedGuide) => (
                    <div key={linkedGuide.guide_id} className="flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-border/20"
                      onClick={() => isPurchased && linkedGuide.master_access_code && navigate(`/access/${linkedGuide.guide_id}?access_code=${linkedGuide.master_access_code}`)}
                    >
                      {linkedGuide.image_url && (
                        <img src={linkedGuide.image_url} alt={linkedGuide.custom_title || linkedGuide.title}
                          className="w-14 h-14 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-medium text-xs leading-snug">{linkedGuide.custom_title || linkedGuide.title}</h4>
                        {isPurchased && linkedGuide.master_access_code && (
                          <span className="text-[10px] text-primary font-medium mt-0.5">Listen →</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <div className="mobile-surface overflow-hidden rounded-[24px]">
                <div className="px-4 py-3 border-b border-border/30">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    You Might Also Like
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {relatedGuides.map((relatedGuide) => (
                    <div
                      key={relatedGuide.id}
                      className="flex gap-3 p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors border border-border/20"
                      onClick={() => navigate(`/guide/${relatedGuide.slug || relatedGuide.id}`)}
                    >
                      <img
                        src={relatedGuide.image}
                        alt={relatedGuide.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h5 className="font-medium text-xs leading-snug">{relatedGuide.title}</h5>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{relatedGuide.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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