import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

// Stripe instance will be loaded dynamically using the secret key
let stripePromise: Promise<Stripe | null> | null = null;

// Payment form component that uses Stripe Elements
const PaymentForm: React.FC<{
  guide: any;
  guestEmail: string;
  isGuest: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}> = ({ guide, guestEmail, isGuest, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded properly');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          guide_id: guide.id,
          guest_email: isGuest ? guestEmail : undefined,
          is_guest: isGuest,
        },
      });

      if (functionError) throw functionError;
      if (!data?.client_secret) throw new Error('Failed to create payment intent');

      // Confirm payment with Stripe
      const { error: paymentError } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: isGuest ? guestEmail : user?.email,
          },
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: isGuest ? guestEmail : user?.email,
            guideId: guide.id,
            guideTitle: guide.title,
            accessCode: guide.access_code
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      toast({
        title: "Payment Successful!",
        description: "Your audio guide purchase has been completed. Check your email for confirmation.",
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      toast({
        title: "Payment Failed",
        description: err.message || 'There was an error processing your payment.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <Label className="text-sm font-medium mb-2 block">Card Information</Label>
        <div className="p-3 border rounded border-input bg-background">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  '::placeholder': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(guide.price_usd / 100).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
};

export const EmbeddedCheckout: React.FC<EmbeddedCheckoutProps> = ({ guide, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        setKeyLoading(true);
        setKeyError(null);
        
        const { data, error } = await supabase.functions.invoke('get-stripe-key');
        
        if (error) throw error;
        if (!data?.publishableKey) throw new Error('No Stripe publishable key received');
        
        // Initialize Stripe with the dynamic key
        if (!stripePromise) {
          stripePromise = loadStripe(data.publishableKey);
        }
        
        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (err: any) {
        console.error('Failed to load Stripe key:', err);
        setKeyError(err.message || 'Failed to load payment system');
      } finally {
        setKeyLoading(false);
      }
    };

    loadStripeKey();
  }, []);

  const handleStartPayment = async () => {
    const targetEmail = user?.email || email;
    
    if (!targetEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to continue"
      });
      return;
    }

    setShowStripeForm(true);
  };

  // Show error if key loading failed
  if (keyError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Payment System Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{keyError}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading while fetching Stripe key
  if (keyLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading Payment System...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Stripe payment form rendering
  if (showStripeForm && stripe) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Payment
          </CardTitle>
          <CardDescription>
            Secure payment powered by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guide Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">{guide.title}</h4>
            {guide.creator_name && (
              <p className="text-sm text-muted-foreground">by {guide.creator_name}</p>
            )}
            <p className="text-lg font-semibold mt-2">
              ${(guide.price_usd / 100).toFixed(2)}
            </p>
          </div>

          <Elements stripe={stripe}>
            <PaymentForm
              guide={guide}
              guestEmail={email}
              isGuest={!user}
              onSuccess={onSuccess}
              onCancel={() => setShowStripeForm(false)}
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  // Logged-in user checkout
  if (user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Complete Purchase
          </CardTitle>
          <CardDescription>
            You're signed in as {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-1">{guide.title}</h3>
            {guide.creator_name && (
              <p className="text-sm text-muted-foreground mb-2">by {guide.creator_name}</p>
            )}
            <div className="text-lg font-bold text-primary">
              ${(guide.price_usd / 100).toFixed(2)}
            </div>
          </div>

          <Button 
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? 'Initializing...' : 'Purchase Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Guest checkout and account creation options
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Purchase Audio Guide
        </CardTitle>
        <CardDescription>
          Buy instantly or create an account for better tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guide Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-1">{guide.title}</h3>
          {guide.creator_name && (
            <p className="text-sm text-muted-foreground mb-2">by {guide.creator_name}</p>
          )}
          <div className="text-lg font-bold text-primary">
            ${(guide.price_usd / 100).toFixed(2)}
          </div>
        </div>

        {!isCreatingAccount ? (
          <>
            {/* Guest Checkout */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send your audio guide access details here
                </p>
              </div>

              <Button 
                onClick={handleStartPayment}
                disabled={loading || !email}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? 'Initializing...' : 'Buy as Guest'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Account Benefits */}
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium mb-2">Create an account for:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Purchase history and easy re-downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Personalized recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Connect with creators
                  </li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setIsCreatingAccount(true)}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Create Account & Purchase
              </Button>
            </div>
          </>
        ) : (
          /* Quick Account Creation */
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Quick account creation will be available soon. Please use guest checkout for now."
                });
                setIsCreatingAccount(false);
              }}
              disabled={loading || !email}
              className="w-full"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Create Account & Purchase
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setIsCreatingAccount(false)}
              className="w-full"
            >
              Back to guest checkout
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center p-3 bg-muted/30 rounded">
          <Lock className="w-3 h-3 inline mr-1" />
          Secure payment powered by Stripe. Your payment information is encrypted and protected.
        </div>
      </CardContent>
    </Card>
  );
};