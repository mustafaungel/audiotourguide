import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { SEO } from '@/components/SEO';
import { useState, useEffect, useRef } from "react";
import { MultiTabAudioPlayer } from "@/components/MultiTabAudioPlayer";
import { Button } from "@/components/ui/button";
import { GuestReviewForm } from "@/components/GuestReviewForm";
import { GuideLanguageSelector } from '@/components/GuideLanguageSelector';
import { LiveListenersBadge } from '@/components/LiveListenersBadge';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, ChevronLeft, Lock, Wifi, WifiOff, RotateCcw, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { withRetry, isNetworkError, getRegionalErrorMessage } from "@/utils/networkUtils";
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
  const [sectionsByLang, setSectionsByLang] = useState<Record<string, any[]>>({});
  const [activeGuideId, setActiveGuideId] = useState<string>('main');
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [linkedLanguageByGuide, setLinkedLanguageByGuide] = useState<Record<string, string>>({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasMiniPlayer, setHasMiniPlayer] = useState(false);

  // Detect MiniPlayer presence in DOM (it's portaled to document.body)
  useEffect(() => {
    const check = () => {
      const mp = document.querySelector('[class*="fixed"][class*="bottom-0"][class*="z-50"]');
      setHasMiniPlayer(!!mp);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const accessCode = searchParams.get('access_code') || searchParams.get('access');
  const sessionId = searchParams.get('session_id');
  const openGuideId = searchParams.get('open_guide_id');

  // Only load once per guideId+accessCode combination
  const loadedKeyRef = useRef('');

  useEffect(() => {
    if (!guideId) {
      setError('Guide ID is required');
      setIsLoading(false);
      return;
    }

    const loadKey = `${guideId}_${accessCode}_${sessionId}`;
    if (loadedKeyRef.current === loadKey) return;
    loadedKeyRef.current = loadKey;

    verifyAccessAndLoadGuide();
  }, [guideId, accessCode, sessionId]);

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
        { maxAttempts: 3, baseDelay: 800, maxDelay: 5000 }
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
          name: 'Audio Tour Guides',
          avatar: '',
          bio: ''
        }
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);
      // Guide loaded successfully - loadedKeyRef prevents re-fetch

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
          name: 'Audio Tour Guides',
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

  const prefetchOtherLanguages = (languages: any[], currentLang: string, gId: string) => {
    if (!accessCode) return;
    const others = languages.filter((l: any) => l.language_code !== currentLang);
    // Prefetch all other languages in parallel after a short idle delay
    setTimeout(() => {
      others.forEach(async (lang: any) => {
        try {
          const { data } = await supabase.rpc('get_sections_with_access', {
            p_guide_id: gId,
            p_access_code: accessCode,
            p_language_code: lang.language_code
          });
          if (data && data.length > 0) {
            setSectionsByLang(prev => ({ ...prev, [lang.language_code]: data }));
          }
        } catch (_) { /* silent prefetch failure */ }
      });
    }, 300);
  };

  const detectAvailableLanguages = async (guideId: string) => {
    try {
      const { data: languages, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: guideId });

      if (error) return;

      if (languages && languages.length > 0) {
        setAvailableLanguages(languages);

        // Device language detection: match browser locale to available languages
        const deviceLang = (navigator.language || navigator.languages?.[0] || 'en').substring(0, 2).toLowerCase();
        const deviceMatch = languages.find((l: any) => l.language_code === deviceLang);
        const enLang = languages.find((l: any) => l.language_code === 'en');
        // Priority: device language > English > first available
        const selectedLang = deviceMatch ? deviceLang : (enLang ? 'en' : languages[0].language_code);
        setSelectedLanguage(selectedLang);
        await fetchSectionsForLanguage(guideId, selectedLang);

        // Background prefetch other languages in parallel
        prefetchOtherLanguages(languages, selectedLang, guideId);
      } else {
        setSections([]);
      }
    } catch (_) {
      setSections([]);
    }
  };

  const fetchSectionsForLanguage = async (guideId: string, languageCode: string) => {
    if (!accessCode) return;
    
    try {
      console.log(`[AUDIO-ACCESS] Fetching sections for language: ${languageCode}`);
      
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

      if (!sectionsData || sectionsData.length === 0) {
        // Use already-loaded availableLanguages instead of making another RPC call
        if (availableLanguages.length > 0) {
          const fallbackLang = availableLanguages[0].language_code;
          if (fallbackLang !== languageCode) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .rpc('get_sections_with_access', {
                p_guide_id: guideId,
                p_access_code: accessCode,
                p_language_code: fallbackLang
              });

            if (!fallbackError && fallbackData && fallbackData.length > 0) {
              setSections(fallbackData);
              setSectionsByLang(prev => ({ ...prev, [fallbackLang]: fallbackData }));
              setSelectedLanguage(fallbackLang);

              toast({
                title: "Language Auto-Selected",
                description: `Guide is available in ${availableLanguages[0].native_name}`,
              });
              return;
            }
          }
        }

        setSections([]);
        return;
      }

      setSections(sectionsData);
      setSectionsByLang(prev => ({ ...prev, [languageCode]: sectionsData }));
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    console.log(`[AUDIO-ACCESS] Main guide language changed to: ${languageCode}`);
    
    // 1. Update flag immediately (optimistic)
    setSelectedLanguage(languageCode);
    
    // 2. If cached, show instantly
    if (sectionsByLang[languageCode]) {
      setSections(sectionsByLang[languageCode]);
      return;
    }
    
    // 3. Not cached — fetch in background (old sections stay visible via lastValidSectionsRef in player)
    if (guideId) {
      try {
        const { data: sectionsData, error } = await supabase
          .rpc('get_sections_with_access', {
            p_guide_id: guideId,
            p_access_code: accessCode || '',
            p_language_code: languageCode
          });
        
        if (!error && sectionsData && sectionsData.length > 0) {
          setSections(sectionsData);
          setSectionsByLang(prev => ({ ...prev, [languageCode]: sectionsData }));
        } else if (!error && (!sectionsData || sectionsData.length === 0)) {
          console.warn('No sections for language:', languageCode);
        }
      } catch (err) {
        console.error('Error fetching sections:', err);
      }
    }
  };

  // Handle language changes for linked guides only — main guide is handled by handleLanguageChange directly
  useEffect(() => {
    const handleGuideLangChange = (e: CustomEvent) => {
      const { guideId: targetGuideId, languageCode: newLang } = (e as any).detail || {};
      
      // Skip main guide — page already handles it via handleLanguageChange
      if (targetGuideId && targetGuideId !== guide?.id) {
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
        { maxAttempts: 3, baseDelay: 800, maxDelay: 5000 }
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
          name: 'Audio Tour Guides',
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AudioGuideLoader 
          variant="page" 
          message={sessionId ? t('verifyingPayment', selectedLanguage) : t('unlockingTour', selectedLanguage)} 
        />
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-4">{t('accessDenied', selectedLanguage)}</h1>
              <p className="text-muted-foreground mb-4">
                {error || t('noAccess', selectedLanguage)}
              </p>
              
              {/* Show different actions based on the error type */}
              <div className="flex flex-col gap-3 items-center">
                {/* Network-aware retry button */}
                {isNetworkIssue && (
                  <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <WifiOff className="w-5 h-5 text-blue-600" />
                       <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {t('connectionIssue', selectedLanguage)}
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
                          {t('retrying', selectedLanguage)}
                        </>
                      ) : (
                        <>
                          <Wifi className="w-4 h-4 mr-2" />
                          {t('retryConnection', selectedLanguage)} ({retryCount + 1})
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
                    {t('paymentRetry', selectedLanguage)}
                  </Button>
                )}
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/guides')}>
                    {t('browseGuides', selectedLanguage)}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    {t('goHome', selectedLanguage)}
                  </Button>
                </div>
                
                {sessionId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('contactSupport', selectedLanguage)} {sessionId.slice(-8)}
                  </p>
                )}
                
                {/* Regional troubleshooting info */}
                {isNetworkIssue && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                     <p className="text-xs font-medium text-foreground mb-2">
                      {t('troubleshootingTips', selectedLanguage)}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {t('trySwitchingNetwork', selectedLanguage)}</li>
                      <li>• {t('checkOtherWebsites', selectedLanguage)}</li>
                      <li>• {t('tryDisablingVpn', selectedLanguage)}</li>
                      <li>• {t('clearBrowserCache', selectedLanguage)}</li>
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


  const guideImageUrl = (guide.image_urls?.[0] || guide.image_url)?.startsWith('data:image')
    ? (guide.image_urls?.[0] || guide.image_url)
    : (guide.image_urls?.[0] || guide.image_url) || '/hero-audio-guide.jpg';

  const totalDuration = sections && sections.length > 0
    ? Math.floor(sections.reduce((total: number, section: any) => total + (section.duration_seconds || 0), 0) / 60)
    : Math.floor(guide.duration / 60);

  return (
    <div className="min-h-screen bg-background">
      {/* Only set SEO after guide loads - prevents title flickering in browser tab */}
      {guide && (
        <SEO
          title={`${guide.title} in ${guide.location}`}
          description={guide.description || `Listen to ${guide.title} audio tour guide.`}
          image={guideImageUrl !== '/hero-audio-guide.jpg' ? guideImageUrl : undefined}
          noindex={true}
        />
      )}
      {/* iOS-style minimal navbar */}
      <div className="sticky top-0 z-50 bg-primary/5 dark:bg-primary/10 backdrop-blur-xl border-b border-primary/15 shadow-sm will-change-transform transform-gpu">
        <div className="grid grid-cols-[52px_1fr_48px] items-center px-2 min-h-12 h-auto py-1.5">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 shrink-0 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center transition-colors active:scale-90"
            aria-label={t('back', selectedLanguage)}
          >
            <ChevronLeft className="w-[22px] h-[22px] text-primary" />
          </button>
          <span className="text-sm font-semibold text-foreground text-center px-1 line-clamp-2 break-words inline-flex items-center justify-center gap-1.5">
            <Headphones className="h-4 w-4 text-primary shrink-0" />
            {guide.title}
          </span>
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Hero Section with blurred background */}
      <div className="relative overflow-hidden">
        {/* Blurred background from guide image */}
        <div
          className="absolute inset-0 scale-110 opacity-20"
          style={{
            backgroundImage: `url(${guideImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

        <div className="relative px-4 pt-6 pb-5 space-y-4 max-w-3xl mx-auto">
          {/* Guide Image — centered */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={guideImageUrl}
                alt={guide.title}
                className="w-44 h-44 rounded-2xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.08),0_16px_48px_rgba(0,0,0,0.05)] ring-2 ring-primary/20"
                onError={(e) => { e.currentTarget.src = '/hero-audio-guide.jpg'; }}
              />
              <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-lg glass-badge text-foreground border-0">
                {guide.category}
              </Badge>
            </div>
          </div>

          {/* Title & metadata — centered, constrained width */}
          <div className="text-center space-y-2 max-w-sm mx-auto">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {guide.title}
            </h1>
            <div className="flex justify-center mt-1">
              <LiveListenersBadge guideId={guide.id} />
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{guide.location}</span>
              </span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{totalDuration} {t('min', selectedLanguage)}</span>
              </span>
            </div>

            {/* Expandable description */}
            {guide.description && (
              <div className="pt-1">
                <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                  {guide.description}
                </p>
                {guide.description.length > 100 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-xs text-primary font-medium mt-1 active:opacity-60 transition-opacity min-h-[44px] inline-flex items-center"
                  >
                    {showFullDescription ? t('showLess', selectedLanguage) : t('showMore', selectedLanguage)}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Language Selector — stable height */}
          <div className="min-h-[48px]">
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
          </div>
        </div>
      </div>

      {/* Content area — dynamic bottom padding based on mini player visibility */}
      <div className={`px-4 ${hasMiniPlayer ? 'pb-40' : 'pb-6'} space-y-4 max-w-3xl mx-auto transition-[padding] duration-300`}>
        {/* Multi-tab Audio Interface */}
        <div>
          <MultiTabAudioPlayer
            mainGuide={{
              id: guide.id,
              title: guide.title,
              description: guide.description,
              audio_url: guide.audio_url,
              image_url: guide.image_url,
            }}
            mainSections={sections}
            accessCode={accessCode || undefined}
            languageCode={selectedLanguage}
            guideImageUrl={guideImageUrl}
            onActiveTabChange={setActiveGuideId}
          />
        </div>

        {/* Guest Feedback — below sections, above mini player */}
        <div>
          {!showReviewForm ? (
             <button
              onClick={() => setShowReviewForm(true)}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] py-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-sm font-medium text-foreground btn-raised active:scale-[0.98] active:bg-primary/10 hover:shadow-md transition-all duration-200"
            >
              <Star className="w-4 h-4 text-yellow-500" />
              {t('leaveFeedback', selectedLanguage)}
            </button>
          ) : (
            <div className="transition-all duration-300 ease-out">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{t('leaveFeedback', selectedLanguage)}</span>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-xs text-muted-foreground active:opacity-60"
                >
                  {t('close', selectedLanguage)}
                </button>
              </div>
              <GuestReviewForm guideId={guide.id} lang={selectedLanguage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}