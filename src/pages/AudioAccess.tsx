import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SectionAudioPlayer } from "@/components/SectionAudioPlayer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, ChevronLeft, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

    // Check if user is admin and no access code provided
    if (!accessCode && !sessionId && user) {
      console.log('[AUDIO-ACCESS] Checking admin access for user:', user.id);
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        console.log('[AUDIO-ACCESS] Admin access granted');
        setIsAdminAccess(true);
        await loadGuideDirectly();
        return;
      }
    }

    if (!accessCode && !sessionId) {
      console.error('[AUDIO-ACCESS] Missing access code or session ID for non-admin user');
      setError('Access code or payment session is required');
      setIsLoading(false);
      return;
    }

    console.log('[AUDIO-ACCESS] Verifying access:', { guideId, accessCode });
    setIsLoading(true);
    setError(null);

    try {
      // Use secure function to verify access code without exposing sensitive data
      console.log('[AUDIO-ACCESS] Verifying access with secure function:', { 
        guide_id: guideId, 
        access_code: accessCode?.trim(),
        user: user?.id || 'guest'
      });
      
      // First, verify if the access code is valid using the secure function
      const { data: isValidAccess, error: verifyError } = await supabase
        .rpc('verify_access_code_secure', {
          p_access_code: accessCode?.trim(),
          p_guide_id: guideId
        });

      console.log('[AUDIO-ACCESS] Access verification result:', { 
        isValidAccess, 
        verifyError
      });

      if (verifyError) {
        console.error('[AUDIO-ACCESS] Access verification error:', verifyError);
        setError(`Access verification failed: ${verifyError.message}`);
        setIsLoading(false);
        return;
      }

      if (!isValidAccess) {
        console.error('[AUDIO-ACCESS] Invalid access code');
        setError('Invalid access code or guide not found');
        setIsLoading(false);
        return;
      }

      // Access verified, now load guide details
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
        },
        sections: guideData.sections ? 
          (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) 
          : []
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);

      toast({
        title: "Access Verified",
        description: "You can now listen to this audio guide",
      });

    } catch (error) {
      console.error('Error verifying access:', error);
      setError('Failed to verify access. Please try again.');
    } finally {
      setIsLoading(false);
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
        },
        sections: guideData.sections ? 
          (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) 
          : []
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);

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

  const verifyPaymentAndGrantAccess = async (sessionId: string) => {
    try {
      console.log('[AUDIO-ACCESS] Verifying payment session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId, guide_id: guideId }
      });

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
      setError(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
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
        },
        sections: guideData.sections ? 
          (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) 
          : []
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);

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
                {sessionId && error?.includes('payment') && (
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
                  <Button onClick={() => navigate('/search')}>
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
                      {Math.floor(guide.duration / 60)} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {guide.rating || 0} ({guide.total_reviews || 0})
                    </div>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section-Based Audio Player */}
          <div className="mb-6">
            <SectionAudioPlayer
              guideId={guide.id}
              guideTitle={guide.title}
              sections={guide.sections || []}
              mainAudioUrl={guide.audio_url}
            />
          </div>
        </div>
      </div>
    </div>
  );
}