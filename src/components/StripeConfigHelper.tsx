import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Settings, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

export const StripeConfigHelper: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [config, setConfig] = useState<any>(null);

  const checkStripeConfig = async () => {
    setIsChecking(true);
    try {
      console.log('[STRIPE-CONFIG] Checking Stripe configuration...');
      
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-key');
      
      if (keyError) {
        throw new Error(`Stripe key error: ${keyError.message}`);
      }

      const publishableKey = keyData?.publishableKey;
      const isLiveMode = publishableKey?.startsWith('pk_live_');
      const isTestMode = publishableKey?.startsWith('pk_test_');
      
      setConfig({
        hasKey: !!publishableKey,
        keyPrefix: publishableKey?.substring(0, 12) || 'N/A',
        isLiveMode,
        isTestMode,
        timestamp: new Date().toISOString(),
      });

      const modeText = isLiveMode ? 'LIVE' : isTestMode ? 'TEST' : 'UNKNOWN';
      
      toast({
        title: "Stripe Configuration",
        description: `Mode: ${modeText} | Key: ${publishableKey ? 'Found' : 'Missing'}`,
        variant: isLiveMode ? "default" : "default"
      });

    } catch (error: any) {
      console.error('[STRIPE-CONFIG] Error:', error);
      toast({
        title: "Configuration Check Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getRecommendation = () => {
    if (!config) return null;
    
    if (!config.hasKey) {
      return {
        type: 'error',
        title: 'Missing Stripe Key',
        description: 'No Stripe publishable key found. Please configure your Stripe keys in the edge function secrets.',
      };
    }

    if (config.isLiveMode) {
      return {
        type: 'warning',
        title: 'Live Mode Active',
        description: 'You are using live Stripe keys. Ensure your Stripe account is fully activated and configured for live payments. Consider switching to test mode if experiencing issues.',
      };
    }

    if (config.isTestMode) {
      return {
        type: 'success',
        title: 'Test Mode Active',
        description: 'Using test mode - this is recommended for development. Use test card numbers like 4242 4242 4242 4242.',
      };
    }

    return {
      type: 'error',
      title: 'Invalid Key Format',
      description: 'The Stripe key format is not recognized. Please check your configuration.',
    };
  };

  const recommendation = getRecommendation();

  return (
    <Card className="w-full max-w-md mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Stripe Configuration
          {config?.isLiveMode && <Badge variant="destructive" className="text-xs">LIVE</Badge>}
          {config?.isTestMode && <Badge variant="secondary" className="text-xs">TEST</Badge>}
        </CardTitle>
        <CardDescription>
          Check and validate your Stripe setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkStripeConfig}
          disabled={isChecking}
          className="w-full"
          variant="outline"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Configuration
            </>
          )}
        </Button>

        {config && (
          <div className="text-xs bg-muted/60 p-3 rounded border space-y-2">
            <div className="flex justify-between">
              <span>Key Status:</span>
              <span className={config.hasKey ? 'text-green-600' : 'text-red-600'}>
                {config.hasKey ? 'Found' : 'Missing'}
              </span>
            </div>
            {config.hasKey && (
              <div className="flex justify-between">
                <span>Key Prefix:</span>
                <span className="font-mono">{config.keyPrefix}...</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className={`font-medium ${
                config.isLiveMode ? 'text-orange-600' : 
                config.isTestMode ? 'text-blue-600' : 'text-red-600'
              }`}>
                {config.isLiveMode ? 'LIVE' : config.isTestMode ? 'TEST' : 'UNKNOWN'}
              </span>
            </div>
          </div>
        )}

        {recommendation && (
          <Alert variant={recommendation.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">{recommendation.title}</div>
              <div className="text-sm">{recommendation.description}</div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <a 
            href="https://dashboard.stripe.com/test/apikeys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary"
          >
            <ExternalLink className="w-3 h-3" />
            Stripe Test Keys
          </a>
        </div>
      </CardContent>
    </Card>
  );
};