import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mail, Send, Eye, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { ButtonLoader } from '@/components/AudioGuideLoader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestEmailData {
  recipientEmail: string;
  recipientName: string;
  guideId: string;
  guideTitle: string;
  guideLocation: string;
  includeQRCode: boolean;
  languages: string[];
  masterAccessCode: string;
}

export const AdminEmailTesting = () => {
  const [testData, setTestData] = useState<TestEmailData>({
    recipientEmail: '',
    recipientName: 'Test User',
    guideId: '',
    guideTitle: 'Sample Audio Guide',
    guideLocation: 'Paris, France',
    includeQRCode: true,
    languages: ['English'],
    masterAccessCode: ''
  });

  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    loadAvailableGuides();
  }, []);

  const loadAvailableGuides = async () => {
    try {
      const { data: guides, error } = await supabase
        .from('audio_guides')
        .select('id, title, location, price_usd, languages, master_access_code')
        .eq('is_published', true)
        .eq('is_approved', true)
        .limit(10);

      if (error) throw error;
      setAvailableGuides(guides || []);
    } catch (error) {
      console.error('Error loading guides:', error);
    }
  };

  const handleGuideSelection = (guideId: string) => {
    const selectedGuide = availableGuides.find(g => g.id === guideId);
    if (selectedGuide) {
      setTestData(prev => ({
        ...prev,
        guideId: selectedGuide.id,
        guideTitle: selectedGuide.title,
        guideLocation: selectedGuide.location,
        languages: selectedGuide.languages || ['English'],
        masterAccessCode: selectedGuide.master_access_code || ''
      }));
    }
  };

  const sendTestEmail = async () => {
    if (!testData.recipientEmail || !testData.guideId || !testData.masterAccessCode) {
      toast.error('Please fill in recipient email and select a guide');
      return;
    }

    setLoading(true);
    setEmailResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-confirmation-email', {
        body: {
          recipientEmail: testData.recipientEmail,
          recipientName: testData.recipientName,
          guideId: testData.guideId,
          testData: {
            title: testData.guideTitle,
            location: testData.guideLocation,
            access_code: testData.masterAccessCode,
            include_qr_code: testData.includeQRCode,
            languages: testData.languages
          }
        }
      });

      if (error) throw error;

      setEmailResult({
        success: true,
        message: `Test email sent successfully to ${testData.recipientEmail}`
      });
      toast.success('Test email sent successfully!');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setEmailResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
      toast.error('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const previewEmail = async () => {
    if (!testData.guideId || !testData.masterAccessCode) {
      toast.error('Please select a guide first');
      return;
    }

    setPreviewLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('preview-confirmation-email', {
        body: {
          guideId: testData.guideId,
          testData: {
            title: testData.guideTitle,
            location: testData.guideLocation,
            access_code: testData.masterAccessCode,
            include_qr_code: testData.includeQRCode,
            languages: testData.languages
          }
        }
      });

      if (error) throw error;

      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(data.html);
        previewWindow.document.close();
      } else {
        toast.error('Please allow popups to preview email');
      }
    } catch (error: any) {
      console.error('Error previewing email:', error);
      toast.error('Failed to preview email');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template Testing
        </CardTitle>
        <CardDescription>
          Test and preview the premium confirmation email template with different data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Information */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={testData.recipientEmail}
                onChange={(e) => setTestData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="test@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={testData.recipientName}
                onChange={(e) => setTestData(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Guide Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Guide Information</h3>
          
          <div>
            <Label htmlFor="guideSelect">Select Published & Approved Guide *</Label>
            <Select value={testData.guideId} onValueChange={handleGuideSelection}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a guide to test with..." />
              </SelectTrigger>
              <SelectContent>
                {availableGuides.map((guide) => (
                  <SelectItem key={guide.id} value={guide.id}>
                    {guide.title} - {guide.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guideTitle">Guide Title</Label>
              <Input
                id="guideTitle"
                value={testData.guideTitle}
                onChange={(e) => setTestData(prev => ({ ...prev, guideTitle: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guideLocation">Guide Location</Label>
              <Input
                id="guideLocation"
                value={testData.guideLocation}
                onChange={(e) => setTestData(prev => ({ ...prev, guideLocation: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeQRCode"
              checked={testData.includeQRCode}
              onChange={(e) => setTestData(prev => ({ ...prev, includeQRCode: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="includeQRCode" className="text-sm">
              Include QR Code in email
            </Label>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={previewEmail}
            variant="outline"
            disabled={previewLoading || !testData.guideId || !testData.masterAccessCode}
            className="flex-1"
          >
            {previewLoading ? (
              <ButtonLoader text="Loading..." />
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview Email
              </>
            )}
          </Button>
          
          <Button
            onClick={sendTestEmail}
            disabled={loading || !testData.recipientEmail || !testData.guideId || !testData.masterAccessCode}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {emailResult && (
          <div className={`p-4 rounded-lg border flex items-center gap-2 ${
            emailResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {emailResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{emailResult.message}</span>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Testing Instructions:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Select a published guide or use custom data</li>
            <li>• Preview the email template before sending</li>
            <li>• Use real email addresses for delivery testing</li>
            <li>• Check Resend dashboard for delivery status</li>
            <li>• Verify email rendering across different clients</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};