import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { NewSectionAudioPlayer } from "@/components/NewSectionAudioPlayer";
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

  const accessCode = searchParams.get('access_code') || searchParams.get('access');
  const sessionId = searchParams.get('session_id');

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

      // Use retry mechanism for network resilience
      const result = await withRetry(
        async () => {
          return await supabase.rpc('get_guide_with_access', {
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
      
      // Fetch sections for the default language
      await fetchSectionsForLanguage(guideId, selectedLanguage);

      toast({
        title: "Access Verified",
        description: "You can now listen to this audio guide",
      });

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
      
      // Fetch sections for the default language
      await fetchSectionsForLanguage(guideId, selectedLanguage);

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

  const fetchSectionsForLanguage = async (guideId: string, languageCode: string) => {
    if (!accessCode) return;
    
    try {
      // Use RPC function to bypass RLS and fetch sections with access verification
      const { data: sectionsData, error } = await supabase
        .rpc('get_sections_with_access', {
          p_guide_id: guideId,
          p_access_code: accessCode,
          p_language_code: languageCode
        });

      if (error) {
        console.error('Error fetching sections:', error);
        // Fallback: try with 'en' if the requested language fails
        if (languageCode !== 'en') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .rpc('get_sections_with_access', {
              p_guide_id: guideId,
              p_access_code: accessCode,
              p_language_code: 'en'
            });
          
          if (!fallbackError && fallbackData) {
            setSections(fallbackData || []);
            return;
          }
        }
        setSections([]);
        return;
      }

      setSections(sectionsData || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    if (guideId) {
      await fetchSectionsForLanguage(guideId, languageCode);
    }
  };

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
      
      // Fetch sections for the default language
      await fetchSectionsForLanguage(guideId, selectedLanguage);

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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {sessionId ? 'Verifying payment...' : 'Verifying access...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
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
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Access Verified Header */}
          {accessGranted && (
            <Card className={`mb-6 ${isAdminAccess 
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20' 
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 ${isAdminAccess ? 'text-blue-600' : 'text-green-600'}`} />
                  <div>
                    <p className={`font-medium ${isAdminAccess 
                      ? 'text-blue-800 dark:text-blue-200' 
                      : 'text-green-800 dark:text-green-200'}`}>
                      {isAdminAccess ? 'Admin Access' : 'Access Verified'}
                    </p>
                    <p className={`text-sm ${isAdminAccess 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-green-600 dark:text-green-400'}`}>
                      {isAdminAccess 
                        ? 'You are viewing this guide with administrator privileges' 
                        : 'You have full access to this audio guide'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guide Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Guide Image */}
                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
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
                    {guide.languages && guide.languages.length > 0 && (
                      <div className="flex items-center gap-2">
                        {guide.languages.map((language: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    )}
                   </div>

                </div>
              </div>
              
              {/* Language Selector */}
              <GuideLanguageSelector 
                guideId={guide.id}
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </CardContent>
          </Card>

          {/* Chapter-First Audio Interface */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Audio Sections</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchSectionsForLanguage(guide.id, selectedLanguage)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh Sections
              </Button>
            </div>
            <NewSectionAudioPlayer
              guideId={guide.id}
              guideTitle={guide.title}
              sections={sections}
              mainAudioUrl={guide.audio_url}
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