import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, ShoppingCart, User, Mail, Lock, Loader2 } from 'lucide-react';

interface EmbeddedCheckoutProps {
  guide: {
    id: string;
    title: string;
    price_usd: number;
    creator_name?: string;
    image_url?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EmbeddedCheckout: React.FC<EmbeddedCheckoutProps> = ({ guide, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Force clean state reset on component mount/unmount
  useEffect(() => {
    const cleanup = () => {
      setLoading(false);
      setEmail('');
      setIsCreatingAccount(false);
    };
    
    cleanupRef.current = cleanup;
    
    return () => {
      cleanup();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [componentKey]);

  // Reset component state completely
  const resetComponentState = () => {
    setComponentKey(prev => prev + 1);
    setLoading(false);
    setEmail('');
    setIsCreatingAccount(false);
  };

  // Validate required guide data
  if (!guide.id || !guide.title || !guide.price_usd) {
    console.error('EmbeddedCheckout: Missing required guide data', guide);
    return (
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Error: Invalid guide data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePayment = async (isGuest: boolean = false) => {
    // Clear any existing state before starting
    resetComponentState();
    
    const targetEmail = user?.email || email;
    
    if (!targetEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to continue"
      });
      return;
    }

    setLoading(true);
    console.log('[PAYMENT] Starting payment process for guide:', guide.id, { email: targetEmail, isGuest });

    try {
      // Validate minimum price on frontend
      const MINIMUM_PRICE_USD = 0.50;
      const priceInDollars = guide.price_usd / 100;
      
      if (priceInDollars < MINIMUM_PRICE_USD) {
        toast({
          title: "Price Too Low",
          description: `This guide's price ($${priceInDollars.toFixed(2)}) is below the minimum payment threshold of $${MINIMUM_PRICE_USD.toFixed(2)}. Please contact support.`,
          variant: "destructive",
        });
        return;
      }

      // Enhanced logging before API call
      console.log('[PAYMENT] Invoking create-payment function...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: guide.id,
          guest_email: isGuest ? email : undefined,
          is_guest: isGuest,
        },
      });

      if (error) {
        console.error('[PAYMENT] Supabase function error:', error);
        // Enhanced error message handling
        const errorMessage = error.message || 'Failed to start payment process';
        
        // Check for specific Stripe minimum amount error
        if (errorMessage.includes('minimum payment amount') || errorMessage.includes('$0.50')) {
          toast({
            title: "Payment Amount Too Low",
            description: "This guide's price is below Stripe's minimum payment threshold. Please contact support for assistance.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        return;
      }

      if (!data?.url) {
        console.error('[PAYMENT] No checkout URL received:', data);
        throw new Error('Failed to create payment session');
      }

      console.log('[PAYMENT] Checkout URL received:', data.url);
      
      // Progressive redirect strategy with enhanced logging
      await handleStripeRedirect(data.url);
      
    } catch (err: any) {
      console.error('[PAYMENT] Payment process failed:', err);
      toast({
        title: "Payment Error",
        description: err.message || 'Failed to start payment process.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStripeRedirect = async (checkoutUrl: string): Promise<void> => {
    console.log('🔧 [REDIRECT] Starting browser-compatible redirect to:', checkoutUrl);
    
    // Detect browser type for compatibility
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isFirefox = userAgent.toLowerCase().indexOf('firefox') > -1;
    const isChrome = userAgent.toLowerCase().indexOf('chrome') > -1;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    console.log('🔧 [REDIRECT] Browser detection:', { isSafari, isFirefox, isChrome, isMobile });
    
    // Enhanced Strategy 1: Direct assignment with browser-specific handling
    try {
      console.log('🔧 [REDIRECT] Attempting window.location.href (universal)...');
      
      if (isSafari || isMobile) {
        // Safari and mobile browsers prefer href over assign
        window.location.href = checkoutUrl;
      } else {
        // Chrome, Firefox prefer assign
        window.location.assign(checkoutUrl);
      }
      
      // Don't wait on mobile - redirect immediately
      if (!isMobile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return; // Exit if redirect successful
      
    } catch (redirectError) {
      console.error('🔧 [REDIRECT] Primary redirect failed:', redirectError);
    }
    
    // Strategy 2: Enhanced fallback with better browser support
    try {
      console.log('🔧 [REDIRECT] Fallback: Enhanced new tab strategy...');
      
      // Try multiple window.open approaches
      let newWindow: Window | null = null;
      
      if (isSafari) {
        // Safari-specific approach
        newWindow = window.open(checkoutUrl, '_blank');
      } else {
        // Standard approach for other browsers
        newWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
      }
      
      if (!newWindow || newWindow.closed) {
        console.error('🔧 [REDIRECT] Popup blocked or failed, using clipboard fallback...');
        throw new Error('Popup blocked');
      }
      
      console.log('🔧 [REDIRECT] New tab opened successfully');
      toast({
        title: "Payment Window Opened",
        description: "Complete your payment in the new tab. The window should open automatically.",
        duration: 4000,
      });
      
      return;
      
    } catch (popupError) {
      console.error('🔧 [REDIRECT] Popup strategy failed:', popupError);
    }
    
    // Strategy 3: Clipboard + manual redirect with enhanced UX
    try {
      console.log('🔧 [REDIRECT] Final fallback: clipboard + manual navigation...');
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(checkoutUrl);
        toast({
          title: "Popup Blocked - URL Copied!",
          description: "Payment URL copied to clipboard. Please paste in a new browser tab.",
          duration: 8000,
        });
      } else {
        // Fallback for non-secure contexts or older browsers
        const textarea = document.createElement('textarea');
        textarea.value = checkoutUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
          document.execCommand('copy');
          toast({
            title: "URL Copied (Compatibility Mode)",
            description: "Payment URL copied. Please paste in a new tab to complete payment.",
            duration: 8000,
          });
        } catch (copyError) {
          toast({
            title: "Manual Navigation Required",
            description: `Please manually visit: ${checkoutUrl.substring(0, 50)}...`,
            duration: 10000,
          });
        } finally {
          document.body.removeChild(textarea);
        }
      }
      
    } catch (finalError) {
      console.error('🔧 [REDIRECT] All strategies failed:', finalError);
      
      // Ultimate fallback - show the URL
      toast({
        title: "Browser Compatibility Issue",
        description: "Please check the browser console for the payment URL and navigate manually.",
        variant: "destructive",
        duration: 10000,
      });
      
      // Log URL to console for manual access
      console.log('🔧 [REDIRECT] MANUAL PAYMENT URL:', checkoutUrl);
    }
  };

  // Logged-in user checkout
  if (user) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Purchase
          </CardTitle>
          <CardDescription className="text-sm">
            {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h3 className="font-medium text-sm mb-1">{guide.title}</h3>
            {guide.creator_name && (
              <p className="text-xs text-muted-foreground mb-2">by {guide.creator_name}</p>
            )}
            <div className="text-lg font-bold text-primary">
              ${(guide.price_usd / 100).toFixed(2)}
            </div>
          </div>

          <Button 
            onClick={() => handlePayment(false)}
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-3 h-3 mr-2" />
                Purchase Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Guest checkout and account creation options
  return (
    <div className="w-full max-w-sm space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Purchase Guide
          </CardTitle>
          <CardDescription className="text-sm">
            Enter email to buy instantly
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Guide Summary */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h3 className="font-medium text-sm mb-1">{guide.title}</h3>
          {guide.creator_name && (
            <p className="text-xs text-muted-foreground mb-2">by {guide.creator_name}</p>
          )}
          <div className="text-lg font-bold text-primary">
            ${(guide.price_usd / 100).toFixed(2)}
          </div>
        </div>

        {/* Guest Checkout */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Access details sent here
            </p>
          </div>

          <Button 
            onClick={() => handlePayment(true)}
            disabled={loading || !email}
            className="w-full"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-3 h-3 mr-2" />
                Buy Now
              </>
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
          <Lock className="w-3 h-3 inline mr-1" />
          Secure payment by Stripe
        </div>
        </CardContent>
      </Card>
    </div>
  );
};