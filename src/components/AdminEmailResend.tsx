import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminEmailResend = () => {
  const [email, setEmail] = useState('zysistem@icloud.com');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleResendEmails = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      console.log('Calling admin-resend-email function for:', email);
      
      const { data, error } = await supabase.functions.invoke('admin-resend-email', {
        body: { guestEmail: email.trim() }
      });

      if (error) {
        console.error('Function call error:', error);
        throw error;
      }

      console.log('Function response:', data);
      setResults(data);
      
      const successCount = data.emailResults?.filter((r: any) => r.success).length || 0;
      const totalCount = data.totalPurchases || 0;
      
      if (successCount === totalCount) {
        toast.success(`Successfully sent ${successCount} confirmation emails to ${email}`);
      } else {
        toast.warning(`Sent ${successCount} out of ${totalCount} emails. Check results below.`);
      }
    } catch (error: any) {
      console.error('Email resend error:', error);
      toast.error(`Failed to resend emails: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Email Resend Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter guest email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleResendEmails}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Resend Emails'}
          </Button>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Results for {results.guestEmail}:</h3>
            <p>Total Purchases: {results.totalPurchases}</p>
            
            {results.emailResults?.map((result: any, index: number) => (
              <div 
                key={index}
                className={`p-3 rounded border ${
                  result.success ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-muted-foreground">
                  Guide ID: {result.guide_id}
                </div>
                {result.success ? (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✅ Email sent successfully
                    <br />
                    Access Code: {result.access_code}
                  </div>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    ❌ Failed: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};