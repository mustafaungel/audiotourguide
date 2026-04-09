import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function PaymentCancelled() {
  // Add debugging for payment cancellation
  React.useEffect(() => {
    console.log('[PAYMENT-CANCELLED] Payment was cancelled');
    console.log('[PAYMENT-CANCELLED] Current URL:', window.location.href);
    console.log('[PAYMENT-CANCELLED] URL params:', window.location.search);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Payment Cancelled"
        description="Your payment was cancelled. No charges were made."
        noindex={true}
      />
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">No worries! Your payment was cancelled and no charges were made.</p>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">What happened?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You cancelled the payment process</p>
            <p>• No money was charged to your account</p>
            <p>• The audio guide is still available for purchase</p>
            <p>• Your cart and preferences are saved</p>
          </div>
        </Card>

        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Browsing Guides
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/library">
              <CreditCard className="h-4 w-4 mr-2" />
              View My Library
            </Link>
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Need Help?</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>If you're experiencing issues with payment, please:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Check your internet connection</li>
                <li>Verify your payment method details</li>
                <li>Try a different payment method</li>
                <li>Contact our support team if issues persist</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Explore Free Content</h4>
            <p className="text-sm text-muted-foreground mb-3">
              While you're here, check out our free content and live experiences.
            </p>
            <div className="space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/experiences">
                  Browse Live Experiences
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/creators">
                  Discover Creators
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}