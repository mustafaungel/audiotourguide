import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
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

const stripePromise = loadStripe('pk_live_51QP4VvGslELtkkDqODTnNpN1YJsP5dw5gQGQBESSBIy2q2TCg1C4AzHNrzjkGwJ1jSJL4Dc7sHxjy3Sf5WX3ZnPf00WaTGBH7Y');

export const EmbeddedCheckout: React.FC<EmbeddedCheckoutProps> = ({ guide, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);

  useEffect(() => {
    loadStripe('pk_live_51QP4VvGslELtkkDqODTnNpN1YJsP5dw5gQGQBESSBIy2q2TCg1C4AzHNrzjkGwJ1jSJL4Dc7sHxjy3Sf5WX3ZnPf00WaTGBH7Y').then(setStripe);
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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          guide_id: guide.id,
          guest_email: !user ? email : undefined,
          is_guest: !user
        }
      });

      if (error) throw error;

      if (data?.client_secret) {
        setPaymentIntent(data);
        setShowStripeForm(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) return;

    setLoading(true);

    const { error, paymentIntent: confirmedPayment } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?guide_id=${guide.id}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message
      });
    } else if (confirmedPayment.status === 'succeeded') {
      toast({
        title: "Payment successful!",
        description: `You now have access to "${guide.title}"`
      });
      onSuccess?.();
    }

    setLoading(false);
  };

  if (showStripeForm && stripe && paymentIntent) {
    const options = {
      clientSecret: paymentIntent.client_secret,
      appearance: {
        theme: 'stripe' as const,
      },
    };

    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </CardTitle>
          <CardDescription>
            Secure payment for {guide.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-1">{guide.title}</h3>
            {guide.creator_name && (
              <p className="text-sm text-muted-foreground mb-2">by {guide.creator_name}</p>
            )}
            <div className="text-lg font-bold text-tourism-warm">
              ${(guide.price_usd / 100).toFixed(2)}
            </div>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div id="payment-element" className="p-4 border rounded-lg">
              {/* Stripe Elements will be mounted here */}
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowStripeForm(false);
                  onCancel?.();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading || !stripe || !elements}
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
        </CardContent>
      </Card>
    );
  }

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
            <div className="text-lg font-bold text-tourism-warm">
              ${(guide.price_usd / 100).toFixed(2)}
            </div>
          </div>

          <Button 
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? 'Initializing...' : 'Purchase Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

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
          <div className="text-lg font-bold text-tourism-warm">
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
                className="w-full bg-gradient-primary hover:opacity-90"
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
                    <div className="w-1.5 h-1.5 bg-tourism-warm rounded-full" />
                    Purchase history and easy re-downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-tourism-warm rounded-full" />
                    Personalized recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-tourism-warm rounded-full" />
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
              className="w-full bg-gradient-primary hover:opacity-90"
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