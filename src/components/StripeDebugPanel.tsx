import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Bug, TestTube, ExternalLink } from 'lucide-react';

export const StripeDebugPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testStripeKeys = async () => {
    setTesting(true);
    try {
      console.log('[DEBUG] Testing Stripe key configuration...');
      
      // Test get-stripe-key function
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-key');
      
      console.log('[DEBUG] Stripe key response:', keyData);
      console.log('[DEBUG] Stripe key error:', keyError);
      
      if (keyError) {
        throw new Error(`Stripe key error: ${keyError.message}`);
      }
      
      setDebugInfo({
        publishableKey: keyData?.publishableKey ? 'Found' : 'Missing',
        keyPrefix: keyData?.publishableKey?.substring(0, 7) || 'N/A',
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Stripe Keys Test",
        description: `Publishable key: ${keyData?.publishableKey ? 'Found' : 'Missing'}`,
      });
      
    } catch (error: any) {
      console.error('[DEBUG] Stripe test error:', error);
      toast({
        title: "Stripe Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const testPaymentFlow = async () => {
    setTesting(true);
    try {
      console.log('[DEBUG] Testing payment flow...');
      
      const testGuideId = 'c0a65d8f-0dce-46f0-981d-1819f84730e5';
      const testEmail = 'test@example.com';
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: testGuideId,
          guest_email: testEmail,
          is_guest: true,
        },
      });
      
      console.log('[DEBUG] Payment flow response:', data);
      console.log('[DEBUG] Payment flow error:', error);
      
      if (error) {
        throw new Error(`Payment flow error: ${error.message}`);
      }
      
      if (data?.url) {
        toast({
          title: "Payment Flow Test",
          description: "Checkout URL created successfully!",
        });
        
        // Show the URL but don't redirect automatically
        console.log('[DEBUG] Checkout URL:', data.url);
        setDebugInfo({
          ...debugInfo,
          checkoutUrl: data.url,
          urlDomain: new URL(data.url).hostname,
        });
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error: any) {
      console.error('[DEBUG] Payment flow test error:', error);
      toast({
        title: "Payment Flow Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mb-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
          <Bug className="w-4 h-4" />
          Stripe Debug Panel
          <Badge variant="secondary" className="text-xs">DEBUG</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testStripeKeys}
            disabled={testing}
            className="text-xs"
          >
            <TestTube className="w-3 h-3 mr-1" />
            Test Keys
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={testPaymentFlow}
            disabled={testing}
            className="text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Test Flow
          </Button>
        </div>
        
        {debugInfo && (
          <div className="text-xs bg-white/60 p-2 rounded border">
            <div className="space-y-1">
              {debugInfo.publishableKey && (
                <div>Key: {debugInfo.keyPrefix}... ({debugInfo.publishableKey})</div>
              )}
              {debugInfo.checkoutUrl && (
                <div>URL: {debugInfo.urlDomain}</div>
              )}
              {debugInfo.timestamp && (
                <div className="text-muted-foreground">
                  Last test: {new Date(debugInfo.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}
        
        <p className="text-xs text-blue-600">
          Use this panel to test Stripe configuration and identify issues.
        </p>
      </CardContent>
    </Card>
  );
};