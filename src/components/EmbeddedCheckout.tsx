import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, ShoppingCart, User, Mail, Lock } from 'lucide-react';
import { ButtonLoader } from '@/components/AudioGuideLoader';

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
    console.log('[PAYMENT DEBUG] Starting payment process', {
      guide: guide.id,
      user: user?.id,
      userEmail: user?.email,
      inputEmail: email,
      isGuest,
      loading,
      timestamp: new Date().toISOString()
    });

    const targetEmail = user?.email || email;
    
    // Enhanced email validation
    if (!targetEmail || targetEmail.trim() === '') {
      console.log('[PAYMENT DEBUG] Email validation failed', { targetEmail, user: !!user, inputEmail: email });
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a valid email address to continue"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      console.log('[PAYMENT DEBUG] Email format validation failed', { targetEmail });
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      return;
    }

    // Prevent double submission
    if (loading) {
      console.log('[PAYMENT DEBUG] Already processing, ignoring duplicate request');
      return;
    }

    setLoading(true);
    console.log('[PAYMENT DEBUG] Payment process starting', { 
      targetEmail, 
      isGuest, 
      guidePrice: guide.price_usd,
      guidePriceUSD: guide.price_usd / 100
    });

    try {
      // Validate minimum price on frontend
      const MINIMUM_PRICE_USD = 0.50;
      const priceInDollars = guide.price_usd / 100;
      
      if (priceInDollars < MINIMUM_PRICE_USD) {
        console.log('[PAYMENT DEBUG] Price below minimum', { priceInDollars, minimum: MINIMUM_PRICE_USD });
        toast({
          title: "Price Too Low",
          description: `This guide's price ($${priceInDollars.toFixed(2)}) is below the minimum payment threshold of $${MINIMUM_PRICE_USD.toFixed(2)}. Please contact support.`,
          variant: "destructive",
        });
        return;
      }

      // Log function call details
      const functionPayload = {
        guide_id: guide.id,
        guest_email: isGuest ? email : undefined,
        is_guest: isGuest,
      };
      console.log('[PAYMENT DEBUG] Calling create-payment function with payload:', functionPayload);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: functionPayload,
      });

      console.log('[PAYMENT DEBUG] Function response received', { 
        hasData: !!data, 
        hasError: !!error,
        data: data ? { hasUrl: !!data.url, urlLength: data.url?.length } : null,
        error: error ? { message: error.message, details: error } : null
      });

      if (error) {
        console.error('[PAYMENT DEBUG] Supabase function error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        
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
        console.error('[PAYMENT DEBUG] No checkout URL in response:', { data, hasData: !!data });
        toast({
          title: "Payment Session Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('[PAYMENT DEBUG] Checkout URL received, starting redirect:', {
        url: data.url,
        urlLength: data.url.length,
        urlHost: new URL(data.url).hostname
      });
      
      // Simplified redirect strategy
      handleSimpleRedirect(data.url);
      
    } catch (err: any) {
      console.error('[PAYMENT DEBUG] Payment process exception:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        fullError: err
      });
      toast({
        title: "Payment Error",
        description: err.message || 'Failed to start payment process. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('[PAYMENT DEBUG] Payment process completed, loading set to false');
    }
  };

  const handleSimpleRedirect = (checkoutUrl: string): void => {
    console.log('[REDIRECT DEBUG] Starting simple redirect to:', checkoutUrl);
    
    try {
      // Simple, reliable redirect strategy
      window.location.href = checkoutUrl;
      
      // Show loading message while redirecting
      toast({
        title: "Redirecting to Payment",
        description: "Taking you to Stripe checkout...",
        duration: 3000,
      });
      
    } catch (redirectError) {
      console.error('[REDIRECT DEBUG] Redirect failed, trying new tab:', redirectError);
      
      // Fallback to new tab
      try {
        const newWindow = window.open(checkoutUrl, '_blank');
        if (!newWindow) {
          throw new Error('Popup blocked');
        }
        
        toast({
          title: "Payment Window Opened",
          description: "Complete your payment in the new tab.",
          duration: 4000,
        });
        
      } catch (popupError) {
        console.error('[REDIRECT DEBUG] New tab failed, using clipboard:', popupError);
        
        // Final fallback - copy to clipboard
        try {
          navigator.clipboard.writeText(checkoutUrl);
          toast({
            title: "URL Copied",
            description: "Payment URL copied to clipboard. Please paste in a new tab.",
            duration: 8000,
          });
        } catch (clipboardError) {
          console.error('[REDIRECT DEBUG] All redirect methods failed:', clipboardError);
          toast({
            title: "Manual Navigation Required",
            description: "Please copy this URL to complete payment: " + checkoutUrl,
            variant: "destructive",
            duration: 12000,
          });
        }
      }
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
            {guide.creator_name && guide.creator_name !== 'Anonymous Creator' && (
              <p className="text-xs text-muted-foreground">by {guide.creator_name}</p>
            )}
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
                Purchase Now - ${(guide.price_usd / 100).toFixed(2)}
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
          {guide.creator_name && guide.creator_name !== 'Anonymous Creator' && (
            <p className="text-xs text-muted-foreground">by {guide.creator_name}</p>
          )}
        </div>

        {/* Price Display */}
        <div className="text-center p-3 bg-primary/5 rounded-lg border">
          <div className="text-2xl font-bold text-primary">
            ${(guide.price_usd / 100).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            One-time purchase
          </p>
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
                Buy Now - ${(guide.price_usd / 100).toFixed(2)}
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