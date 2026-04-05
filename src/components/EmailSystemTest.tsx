import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { ButtonLoader } from '@/components/AudioGuideLoader';
import { supabase } from '@/integrations/supabase/client';

export const EmailSystemTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmailSystem = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email-system');
      
      if (error) {
        setResult({
          success: false,
          error: error.message,
          configured: false
        });
      } else {
        setResult({
          success: true,
          ...data
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        configured: false
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System Test
        </CardTitle>
        <CardDescription>
          Test if the email system is properly configured for purchase confirmations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testEmailSystem} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <ButtonLoader text="Testing..." />
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Test Email Configuration
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p className="font-medium text-green-800">Email system is configured correctly!</p>
                    <p className="text-sm text-green-700 mt-1">
                      RESEND_API_KEY is properly set and the email system is ready to send purchase confirmations.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-800">Email system configuration issue</p>
                    <p className="text-sm text-red-700 mt-1">
                      {result.error || 'Unknown error occurred'}
                    </p>
                    {!result.configured && (
                      <p className="text-sm text-red-700 mt-2">
                        Please add the RESEND_API_KEY secret in Supabase Edge Functions settings.
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">How the email system works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>After successful payment, the verify-payment function triggers</li>
            <li>It calls send-confirmation-email with guide and purchase details</li>
            <li>Emails are sent using Resend.com with your custom template</li>
            <li>Customers receive access codes and guide links immediately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};