import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Play, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const guideId = searchParams.get('guide_id');
  const [verifying, setVerifying] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId && guideId) {
      verifyPayment();
    }
  }, [sessionId, guideId]);

  const verifyPayment = async () => {
    try {
      // Verify payment and create purchase record
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId, guideId },
      });

      if (verifyError) throw verifyError;

      setPurchaseData(verifyData);

      // Fetch guide details
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('id', guideId)
        .single();

      if (guideError) throw guideError;
      setGuide(guideData);

      toast({
        title: "Payment Successful!",
        description: "Your audio guide is now available in your library.",
      });
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your purchase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Thank you for your purchase. Your audio guide is ready to enjoy.</p>
        </div>

        {guide && (
          <Card className="p-6 mb-8">
            <div className="flex items-start gap-4">
              {guide.image_url && (
                <img 
                  src={guide.image_url} 
                  alt={guide.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">{guide.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{guide.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Duration: {Math.floor(guide.duration / 60)} min</span>
                  <span>Location: {guide.location}</span>
                </div>
              </div>
            </div>

            {purchaseData?.accessCode && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">Access Code:</p>
                <code className="text-primary font-mono">{purchaseData.accessCode}</code>
              </div>
            )}
          </Card>
        )}

        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link to={`/guide/${guideId}`}>
              <Play className="h-4 w-4 mr-2" />
              Start Listening Now
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/library">
              <Download className="h-4 w-4 mr-2" />
              View My Library
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Exploring
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-card rounded-lg">
          <h4 className="font-medium text-foreground mb-2">What's Next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your guide is now available in "My Library"</li>
            <li>• Download the audio for offline listening</li>
            <li>• Rate and review your experience</li>
            <li>• Share your favorite moments with friends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}