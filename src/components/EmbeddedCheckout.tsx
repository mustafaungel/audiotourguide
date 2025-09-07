import React, { useState } from 'react';
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

  // Add debugging for guide data
  console.log('EmbeddedCheckout received guide:', {
    id: guide.id,
    title: guide.title,
    price_usd: guide.price_usd,
    creator_name: guide.creator_name
  });

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
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: guide.id,
          guest_email: isGuest ? email : undefined,
          is_guest: isGuest,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Failed to create payment session');

      // Redirect to Stripe Checkout in the same tab
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || 'Failed to start payment process.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => handlePayment(false)}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
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
    <div className="w-full max-w-md space-y-4">
      <Card>
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
                onClick={() => handlePayment(true)}
                disabled={loading || !email}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy as Guest
                  </>
                )}
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
    </div>
  );
};