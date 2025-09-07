import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeDebugInfoProps {
  guide: {
    id: string;
    title: string;
    price_usd: number;
  };
}

export const StripeDebugInfo: React.FC<StripeDebugInfoProps> = ({ guide }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      console.log('[STRIPE-DEBUG] Starting payment flow diagnostics...');
      
      // Test the create-payment function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: guide.id,
          guest_email: 'debug@test.com',
          is_guest: true
        }
      });

      const results = {
        timestamp: new Date().toISOString(),
        guideData: {
          id: guide.id,
          title: guide.title,
          price_usd: guide.price_usd,
          priceInCents: guide.price_usd,
          priceInDollars: (guide.price_usd / 100).toFixed(2)
        },
        apiCall: {
          success: !error,
          error: error?.message,
          hasUrl: !!data?.url,
          url: data?.url ? 'URL generated successfully' : 'No URL returned'
        },
        recommendations: []
      };

      // Add recommendations based on results
      if (results.apiCall.success && results.apiCall.hasUrl) {
        results.recommendations.push({
          type: 'success',
          message: 'Payment function is working correctly'
        });
        
        if (guide.price_usd < 50) {
          results.recommendations.push({
            type: 'warning',
            message: `Price is very low ($${(guide.price_usd / 100).toFixed(2)}). Some payment methods have minimum charges.`
          });
        }
        
        results.recommendations.push({
          type: 'info',
          message: 'If Stripe checkout hangs, check: 1) Using test keys with test cards, 2) Domain is configured in Stripe dashboard'
        });
      } else {
        results.recommendations.push({
          type: 'error',
          message: 'Payment function failed - check Stripe secret key configuration'
        });
      }

      setTestResults(results);
      
      toast({
        title: results.apiCall.success ? "Diagnostics Complete" : "Issue Found",
        description: results.apiCall.success ? "Payment flow is working" : "Payment function failed",
        variant: results.apiCall.success ? "default" : "destructive"
      });

    } catch (err: any) {
      console.error('[STRIPE-DEBUG] Diagnostics error:', err);
      setTestResults({
        error: err.message,
        recommendations: [{
          type: 'error',
          message: 'Failed to run diagnostics - check console for details'
        }]
      });
    } finally {
      setTesting(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="w-full max-w-md mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full text-xs"
          >
            <Eye className="w-3 h-3 mr-2" />
            Show Stripe Debug Info
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mb-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            Stripe Diagnostics
            <Badge variant="secondary" className="text-xs">DEBUG</Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="text-xs space-y-2">
          <div>
            <span className="font-medium">Guide ID:</span> {guide.id}
          </div>
          <div>
            <span className="font-medium">Price USD:</span> {guide.price_usd} cents (${(guide.price_usd / 100).toFixed(2)})
          </div>
          <div>
            <span className="font-medium">Current URL:</span> {window.location.href}
          </div>
        </div>

        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          size="sm"
          className="w-full"
        >
          {testing ? 'Running Tests...' : 'Test Payment Function'}
        </Button>

        {testResults && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-white/60 rounded border">
              <div className="font-medium mb-2">Test Results:</div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {testResults.apiCall?.success ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span>Payment API: {testResults.apiCall?.success ? 'Working' : 'Failed'}</span>
                </div>
                
                {testResults.apiCall?.hasUrl && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Stripe URL: Generated</span>
                  </div>
                )}
              </div>

              {testResults.error && (
                <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
                  Error: {testResults.error}
                </div>
              )}
            </div>

            {testResults.recommendations?.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium">Recommendations:</div>
                {testResults.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className={`p-2 rounded text-xs ${
                    rec.type === 'error' ? 'bg-red-50 text-red-700' :
                    rec.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                    rec.type === 'success' ? 'bg-green-50 text-green-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {rec.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};