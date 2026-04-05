import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MultiTabAudioPlayer } from "@/components/MultiTabAudioPlayer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuestReviewForm } from "@/components/GuestReviewForm";
import { GuideLanguageSelector } from '@/components/GuideLanguageSelector';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, ChevronLeft, Lock, CheckCircle, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { withRetry, isNetworkError, getRegionalErrorMessage, getErrorRecoveryActions } from "@/utils/networkUtils";
import { t } from "@/lib/translations";

export default function AudioAccess() {
  const { guideId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [guide, setGuide] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [sections, setSections] = useState<any[]>([]);
  const [activeGuideId, setActiveGuideId] = useState<string>('main');
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [linkedLanguageByGuide, setLinkedLanguageByGuide] = useState<Record<string, string>>({});

  const accessCode = searchParams.get('access_code') || searchParams.get('access');
  const sessionId = searchParams.get('session_id');
  const openGuideId = searchParams.get('open_guide_id');

  useEffect(() => {
    if (!guideId) {
      setError('Guide ID is required');
      setIsLoading(false);
      return;
    }

    verifyAccessAndLoadGuide();
  }, [guideId, accessCode, sessionId, user]);

  // Refresh when ?refresh=1 is present
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh');
    if (shouldRefresh && guideId) {
      fetchSectionsForLanguage(guideId, selectedLanguage);
    }
  }, [searchParams, guideId, selectedLanguage]);

  // Listen to cross-tab updates from Admin editor
  useEffect(() => {
    if (!guideId) return;
    const key = `guide_updated_${guideId}`;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        fetchSectionsForLanguage(guideId, selectedLanguage);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [guideId, selectedLanguage]);

  const verifyAccessAndLoadGuide = async () => {
    if (!guideId) {
      console.error('[AUDIO-ACCESS] Missing guide ID');
      setError('Guide ID is required');
      setIsLoading(false);
      return;
    }

    // Handle direct payment success redirect with session_id
    if (sessionId && !accessCode) {
      console.log('[AUDIO-ACCESS] Verifying payment session:', sessionId);
      await verifyPaymentAndGrantAccess(sessionId);
      return;
    }

    // Admin users must also use access codes for hidden guides

    if (!accessCode && !sessionId) {
      console.error('[AUDIO-ACCESS] Missing access code or session ID for non-admin user');
      setError('Access code or payment session is required');
      setIsLoading(false);
      return;
    }

    console.log('[AUDIO-ACCESS] Verifying access:', { guideId, accessCode, retryCount });
    setIsLoading(true);
    setError(null);
    setIsNetworkIssue(false);

    try {
      let isValidAccess = false;
      let accessType = '';

      console.log('[AUDIO-ACCESS] Starting secure access verification and guide loading:', { 
        guide_id: guideId, 
        access_code: accessCode?.trim(),
        user: user?.id || 'guest',
        isAuthenticated: !!user,
        supabaseAuth: !!supabase.auth.getUser,
        attempt: retryCount + 1
      });

      // Use retry mechanism for network resilience with new RPC
      const result = await withRetry(
        async () => {
          return await supabase.rpc('get_guide_with_access_v2', {
            p_guide_id: guideId,
            p_access_code: accessCode?.trim()
          });
        },
        { maxAttempts: 3, baseDelay: 2000 }
      );
      
      const { data: guideData, error: accessError } = result;

      console.log('[AUDIO-ACCESS] RPC Response:', { 
        hasData: !!guideData, 
        dataLength: guideData?.length || 0,
        hasError: !!accessError,
        errorDetails: accessError,
        errorCode: accessError?.code,
        errorMessage: accessError?.message,
        fullResponse: { data: guideData, error: accessError }
      });

      if (accessError) {
        console.error('[AUDIO-ACCESS] Error verifying access:', accessError);
        const isNetwork = isNetworkError(accessError);
        setIsNetworkIssue(isNetwork);
        
        if (isNetwork) {
          setError(getRegionalErrorMessage(accessError));
        } else {
          setError(`Access verification failed: ${accessError.message || accessError.code || 'Unknown error'}`);
        }
        setIsLoading(false);
        return;
      }

      if (!guideData || guideData.length === 0) {
        console.log('[AUDIO-ACCESS] Invalid access code or no data returned');
        setError('Invalid access code or guide not found');
        setIsLoading(false);
        return;
      }

      const guide = guideData[0]; // RPC returns array
      console.log('[AUDIO-ACCESS] Access verified and guide loaded successfully', {
        title: guide.title,
        isPublished: guide.is_published
      });

      // Creator profile removed - no longer available

      // Transform guide data
      const transformedGuide = {
        ...guide,
        creator: {
          name: 'Anonymous Creator',
          avatar: '',
          bio: ''
        }
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);
      
      // Auto-detect and fetch sections in available language
      await detectAvailableLanguages(guideId);
      
      // Handle open_guide_id parameter if present
      if (openGuideId) {
        console.log('[AUDIO-ACCESS] Auto-opening linked guide:', openGuideId);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openLinkedGuide', {
            detail: { guideId: openGuideId }
          }));
          
          // Clean up URL parameter
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('open_guide_id');
          const newUrl = newSearchParams.toString() 
            ? `${window.location.pathname}?${newSearchParams.toString()}`
            : window.location.pathname;
          navigate(newUrl, { replace: true });
        }, 500); // Small delay to ensure MultiTabAudioPlayer is ready
      }


    } catch (error) {
      console.error('Error verifying access:', error);
      const isNetwork = isNetworkError(error);
      setIsNetworkIssue(isNetwork);
      
      if (isNetwork) {
        setError(getRegionalErrorMessage(error));
      } else {
        setError('Failed to verify access. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const loadGuideDirectly = async () => {
    try {
      // Load guide details directly for admin access
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('id', guideId)
        .maybeSingle();

      if (guideError || !guideData) {
        setError('Guide not found');
        setIsLoading(false);
        return;
      }

      // Creator profile removed - no longer available

      // Transform guide data
      const transformedGuide = {
        ...guideData,
        creator: {
          name: 'Anonymous Creator',
          avatar: '',
          bio: ''
        }
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);
      
      // Auto-detect and fetch sections in available language
      await detectAvailableLanguages(guideId);

      toast({
        title: "Admin Access Granted",
        description: "You are viewing this guide with admin privileges",
      });

    } catch (error) {
      console.error('Error loading guide for admin:', error);
      setError('Failed to load guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const detectAvailableLanguages = async (guideId: string) => {
    try {
      // Get available languages for this guide
      const { data: languages, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: guideId });

      if (error) {
        console.error('Error fetching available languages:', error);
        return;
      }

      if (languages && languages.length > 0) {
        setAvailableLanguages(languages);
        // Prefer English if available, otherwise first language
        const enLang = languages.find((l: any) => l.language_code === 'en');
        const selectedLang = enLang ? 'en' : languages[0].language_code;
        setSelectedLanguage(selectedLang);
        await fetchSectionsForLanguage(guideId, selectedLang);
      } else {
        console.warn('No languages available for this guide');
        setSections([]);
      }
    } catch (error) {
      console.error('Error detecting available languages:', error);
      setSections([]);
    }
  };

  const fetchSectionsForLanguage = async (guideId: string, languageCode: string) => {
    if (!accessCode) return;
    
    try {
      console.log(`[AUDIO-ACCESS] Fetching sections for language: ${languageCode}`);
      
      // Use RPC function to bypass RLS and fetch sections with access verification
      const { data: sectionsData, error } = await supabase
        .rpc('get_sections_with_access', {
          p_guide_id: guideId,
          p_access_code: accessCode,
          p_language_code: languageCode
        });

      if (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
        return;
      }

      // If no sections found for requested language, try to find ANY available language
      if (!sectionsData || sectionsData.length === 0) {
        console.warn(`No sections found for language: ${languageCode}`);
        
        // Get available languages
        const { data: languages } = await supabase
          .rpc('get_guide_languages', { p_guide_id: guideId });
        
        if (languages && languages.length > 0) {
          // Try the first available language
          const fallbackLang = languages[0].language_code;
          console.log(`Falling back to available language: ${fallbackLang}`);
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .rpc('get_sections_with_access', {
              p_guide_id: guideId,
              p_access_code: accessCode,
              p_language_code: fallbackLang
            });
          
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            setSections(fallbackData);
            setSelectedLanguage(fallbackLang);
            setAvailableLanguages(languages);
            
            toast({
              title: "Language Auto-Selected",
              description: `Guide is available in ${languages[0].native_name}`,
            });
            return;
          }
        }
        
        setSections([]);
        return;
      }

      setSections(sectionsData);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    console.log(`[AUDIO-ACCESS] Main guide language changed to: ${languageCode}`);
    
    // Only update main guide sections
    // MultiTabAudioPlayer manages linked guide sections
    setSelectedLanguage(languageCode);
    
    if (guideId) {
      // Fetch new sections for main guide only
      await fetchSectionsForLanguage(guideId, languageCode);
    }
  };

  // Handle language changes for linked guides
  useEffect(() => {
    const handleGuideLangChange = (e: CustomEvent) => {
      const { guideId: targetGuideId, languageCode: newLang } = (e as any).detail || {};
      
      if (targetGuideId === guide?.id) {
        // Main guide language change
        handleLanguageChange(newLang);
      } else if (targetGuideId) {
        // Linked guide language change (just for UI)
        setLinkedLanguageByGuide(prev => ({ ...prev, [targetGuideId]: newLang }));
      }
    };
    
    window.addEventListener('changeGuideLanguage', handleGuideLangChange as EventListener);
    return () => window.removeEventListener('changeGuideLanguage', handleGuideLangChange as EventListener);
  }, [guide?.id]);

  const verifyPaymentAndGrantAccess = async (sessionId: string) => {
    try {
      console.log('[AUDIO-ACCESS] Verifying payment session:', sessionId);
      
      const result = await withRetry(
        async () => {
          return await supabase.functions.invoke('verify-payment', {
            body: { session_id: sessionId, guide_id: guideId }
          });
        },
        { maxAttempts: 3, baseDelay: 2000 }
      );
      
      const { data, error } = result;

      console.log('[AUDIO-ACCESS] Payment verification response:', { data, error });

      if (error) {
        console.error('[AUDIO-ACCESS] Payment verification error:', error);
        // Show more specific error to help with debugging
        setError(`Payment verification error: ${error.message || error}`);
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('[AUDIO-ACCESS] No data returned from verification');
        setError('No response from payment verification. Please contact support.');
        setIsLoading(false);
        return;
      }

      if (!data.success) {
        console.error('[AUDIO-ACCESS] Payment not verified:', data);
        setError(`Payment verification failed: ${data.error || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      console.log('[AUDIO-ACCESS] Payment verified successfully, access code:', data.access_code);
      
      // Redirect to the same URL but with the access code instead of session_id
      if (data.access_code) {
        const newUrl = `/access/${guideId}?access_code=${data.access_code}`;
        console.log('[AUDIO-ACCESS] Redirecting to URL with access code:', newUrl);
        navigate(newUrl, { replace: true });
        return;
      }
      
      // Fallback: Load guide directly if no access code returned
      await loadGuideAfterVerification();
      
      toast({
        title: "Payment Verified!",
        description: "Welcome to your audio guide. Enjoy your experience!",
      });

    } catch (error) {
      console.error('[AUDIO-ACCESS] Error during payment verification:', error);
      const isNetwork = isNetworkError(error);
      setIsNetworkIssue(isNetwork);
      
      if (isNetwork) {
        setError(`Payment verification failed due to connection issues: ${getRegionalErrorMessage(error)}`);
      } else {
        setError(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      setIsLoading(false);
    }
  };

  const loadGuideAfterVerification = async () => {
    try {
      // Load guide details
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('id', guideId)
        .maybeSingle();

      if (guideError || !guideData) {
        setError('Guide not found');
        setIsLoading(false);
        return;
      }

      // Creator profile removed - no longer available

      // Transform guide data
      const transformedGuide = {
        ...guideData,
        creator: {
          name: 'Anonymous Creator',
          avatar: '',
          bio: ''
        }
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);
      
      // Auto-detect and fetch sections in available language
      await detectAvailableLanguages(guideId);

    } catch (error) {
      console.error('Error loading guide after payment verification:', error);
      setError('Failed to load guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <AudioGuideLoader 
            variant="page" 
            message={sessionId ? t('verifyingPayment', selectedLanguage) : t('unlockingTour', selectedLanguage)} 
          />
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                {error || "You don't have access to this audio guide."}
              </p>
              
              {/* Show different actions based on the error type */}
              <div className="flex flex-col gap-3 items-center">
                {/* Network-aware retry button */}
                {isNetworkIssue && (
                  <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <WifiOff className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Connection Issue Detected
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                      This error commonly occurs in certain regions due to network restrictions. 
                      We'll automatically retry with optimized settings.
                    </p>
                    <Button 
                      onClick={async () => {
                        console.log('[AUDIO-ACCESS] Manual retry triggered');
                        setIsRetrying(true);
                        setRetryCount(prev => prev + 1);
                        setError(null);
                        await verifyAccessAndLoadGuide();
                      }}
                      disabled={isRetrying}
                      size="sm"
                      className="w-full"
                    >
                      {isRetrying ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          Retrying Connection...
                        </>
                      ) : (
                        <>
                          <Wifi className="w-4 h-4 mr-2" />
                          Retry Connection (Attempt {retryCount + 1})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {sessionId && error?.includes('payment') && !isNetworkIssue && (
                  <Button 
                    onClick={() => {
                      console.log('[AUDIO-ACCESS] Retrying payment verification');
                      setError(null);
                      verifyAccessAndLoadGuide();
                    }}
                    className="mb-2"
                  >
                    Retry Payment Verification
                  </Button>
                )}
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/guides')}>
                    Browse Guides
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go Home
                  </Button>
                </div>
                
                {sessionId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    If you just completed a payment and are seeing this error, 
                    please contact support with session ID: {sessionId.slice(-8)}
                  </p>
                )}
                
                {/* Regional troubleshooting info */}
                {isNetworkIssue && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Troubleshooting Tips for Regional Access:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Try switching to a different network (mobile data vs WiFi)</li>
                      <li>• Check if you can access other websites normally</li>
                      <li>• If using a VPN, try disabling it temporarily</li>
                      <li>• Clear your browser cache and try again</li>
                    </ul>
                  </div>
                )}
              </div>
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
        <div className="max-w-4xl mx-auto">

          {/* Guide Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Guide Image */}
                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img 
                    src={
                      (guide.image_urls?.[0] || guide.image_url)?.startsWith('data:image') 
                        ? (guide.image_urls?.[0] || guide.image_url)
                        : (guide.image_urls?.[0] || guide.image_url) || '/hero-audio-guide.jpg'
                    } 
                    alt={guide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/hero-audio-guide.jpg';
                    }}
                  />
                </div>

                {/* Guide Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Badge className="mb-2">{guide.category}</Badge>
                    <h1 className="text-2xl md:text-3xl font-bold">{guide.title}</h1>
                    <p className="text-muted-foreground mt-2">{guide.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {guide.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {sections && sections.length > 0 
                        ? `${Math.floor(sections.reduce((total, section) => total + (section.duration_seconds || 0), 0) / 60)} min`
                        : `${Math.floor(guide.duration / 60)} min`
                      }
                    </div>
                   </div>

                </div>
              </div>
              
              {/* Language Selector */}
              <GuideLanguageSelector 
                guideId={guide.id}
                selectedLanguage={
                  (activeGuideId === 'main' || activeGuideId === guide.id)
                    ? selectedLanguage
                    : (linkedLanguageByGuide[activeGuideId] || selectedLanguage)
                }
                onLanguageChange={handleLanguageChange}
                activeGuideId={activeGuideId === 'main' ? guide.id : activeGuideId}
              />
            </CardContent>
          </Card>

          {/* Multi-tab Audio Interface */}
          <div className="mb-6 min-h-[400px]">
            <MultiTabAudioPlayer
              key={`${guide.id}-${accessCode || ''}`}
              mainGuide={{
                id: guide.id,
                title: guide.title,
                description: guide.description,
                audio_url: guide.audio_url,
                image_url: guide.image_url
              }}
              mainSections={sections}
              accessCode={accessCode || undefined}
              languageCode={selectedLanguage}
              onActiveTabChange={setActiveGuideId}
            />
          </div>

          {/* Guest Review Form */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
            <GuestReviewForm guideId={guide.id} />
          </div>
        </div>
      </div>
    </div>
  );
}