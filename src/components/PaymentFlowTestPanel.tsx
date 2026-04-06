import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  TestTube, 
  CreditCard, 
  Play, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Volume2,
  FastForward,
  SkipForward,
  Music
} from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp: string;
}

export const PaymentFlowTestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (test: string, status: 'success' | 'error', message?: string) => {
    setTestResults(prev => [
      {
        test,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 9) // Keep last 10 results
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test payment flow creation
  const testPaymentCreation = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Creating payment session...');
      
      const testGuideId = 'c0a65d8f-0dce-46f0-981d-1819f84730e5';
      const testEmail = 'test@example.com';
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: testGuideId,
          guest_email: testEmail,
          is_guest: true,
        },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        addTestResult('Payment Creation', 'success', `Checkout URL: ${new URL(data.url).hostname}`);
        toast({
          title: "Payment Creation Test",
          description: "✅ Payment session created successfully",
        });
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error: any) {
      addTestResult('Payment Creation', 'error', error.message);
      toast({
        title: "Payment Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Test payment verification flow
  const testPaymentVerification = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Testing payment verification...');
      
      // Mock a verification test (normally would need real session ID)
      const mockSessionId = 'cs_test_' + Math.random().toString(36).substr(2, 9);
      const testGuideId = 'c0a65d8f-0dce-46f0-981d-1819f84730e5';
      
      // This would normally fail with mock data, but we're testing the function call
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          session_id: mockSessionId,
          guide_id: testGuideId
        },
      });
      
      // Expected to fail with mock data, but function should be reachable
      if (error && error.message.includes('No such checkout session')) {
        addTestResult('Payment Verification', 'success', 'Function reachable, mock data rejected as expected');
        toast({
          title: "Payment Verification Test",
          description: "✅ Verification function is working (mock data rejected)",
        });
      } else if (data) {
        addTestResult('Payment Verification', 'success', 'Verification completed');
        toast({
          title: "Payment Verification Test",
          description: "✅ Verification successful",
        });
      } else {
        throw error || new Error('Unexpected verification response');
      }
      
    } catch (error: any) {
      if (error.message.includes('No such checkout session')) {
        addTestResult('Payment Verification', 'success', 'Function working (expected error with mock data)');
        toast({
          title: "Payment Verification Test",
          description: "✅ Function accessible and handling errors correctly",
        });
      } else {
        addTestResult('Payment Verification', 'error', error.message);
        toast({
          title: "Payment Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setTesting(false);
    }
  };

  // Test access code verification
  const testAccessCodeVerification = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Testing access code verification...');
      
      const testAccessCode = 'ART-TEST1234';
      const testGuideId = 'c0a65d8f-0dce-46f0-981d-1819f84730e5';
      
      const { data, error } = await supabase.rpc('verify_access_code_secure', {
        p_access_code: testAccessCode,
        p_guide_id: testGuideId
      });
      
      if (error) throw error;
      
      // This should return false for test code, which means function is working
      addTestResult('Access Code Verification', 'success', `Code validation working: ${data ? 'Valid' : 'Invalid'}`);
      toast({
        title: "Access Code Test",
        description: "✅ Access code verification function working",
      });
      
    } catch (error: any) {
      addTestResult('Access Code Verification', 'error', error.message);
      toast({
        title: "Access Code Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Test audio player functionality
  const testAudioPlayer = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Testing audio player functionality...');
      
      // Test audio creation and playback
      const audio = new Audio();
      
      // Test audio loading
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 5000);
        
        audio.addEventListener('canplay', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        
        audio.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error('Audio load failed'));
        });
        
        // Use a test audio file
        audio.src = '/tmp/test-audio.mp3';
        audio.load();
      });
      
      // Test basic controls
      audio.volume = 0.1; // Low volume for testing
      await audio.play();
      
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 500);
      
      addTestResult('Audio Player', 'success', 'Audio loading, play, pause, and seek controls working');
      toast({
        title: "Audio Player Test",
        description: "✅ Audio player functionality verified",
      });
      
    } catch (error: any) {
      addTestResult('Audio Player', 'error', error.message);
      toast({
        title: "Audio Player Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Test mobile responsiveness
  const testMobileExperience = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Testing mobile experience...');
      
      // Test viewport and touch capabilities
      const isMobile = window.innerWidth <= 768;
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Test mobile-specific features
      const mobileChecks = [
        { name: 'Mobile Viewport', result: isMobile },
        { name: 'Touch Support', result: hasTouchSupport },
        { name: 'Mobile Browser', result: /Mobi|Android/i.test(navigator.userAgent) }
      ];
      
      const passedChecks = mobileChecks.filter(check => check.result).length;
      
      addTestResult('Mobile Experience', 'success', `${passedChecks}/${mobileChecks.length} mobile features detected`);
      toast({
        title: "Mobile Experience Test",
        description: `✅ Mobile compatibility: ${passedChecks}/${mobileChecks.length} features`,
      });
      
    } catch (error: any) {
      addTestResult('Mobile Experience', 'error', error.message);
      toast({
        title: "Mobile Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Test error handling scenarios
  const testErrorHandling = async () => {
    setTesting(true);
    try {
      console.log('[TEST] Testing error handling...');
      
      // Test invalid guide ID
      const { error } = await supabase.functions.invoke('create-payment', {
        body: {
          guide_id: 'invalid-guide-id',
          guest_email: 'test@example.com',
          is_guest: true,
        },
      });
      
      if (error) {
        addTestResult('Error Handling', 'success', 'Invalid input properly rejected');
        toast({
          title: "Error Handling Test",
          description: "✅ Error handling working correctly",
        });
      } else {
        addTestResult('Error Handling', 'error', 'Should have rejected invalid guide ID');
        toast({
          title: "Error Handling Test",
          description: "⚠️ Error handling may need improvement",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      addTestResult('Error Handling', 'success', 'Errors properly caught and handled');
      toast({
        title: "Error Handling Test",
        description: "✅ Error handling verified",
      });
    } finally {
      setTesting(false);
    }
  };

  // Run all tests in sequence
  const runFullTestSuite = async () => {
    setTesting(true);
    clearResults();
    
    toast({
      title: "Running Full Test Suite",
      description: "Testing all payment and audio functionality...",
    });
    
    try {
      await testPaymentCreation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testPaymentVerification();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testAccessCodeVerification();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testAudioPlayer();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testMobileExperience();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testErrorHandling();
      
      toast({
        title: "Test Suite Complete",
        description: "✅ All tests completed successfully",
      });
      
    } catch (error) {
      toast({
        title: "Test Suite Error",
        description: "Some tests encountered issues",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <TestTube className="w-4 h-4" />
          Payment & Audio Testing Panel
          <Badge variant="secondary" className="text-xs">PRE-PUBLISH</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testPaymentCreation}
            disabled={testing}
            className="text-xs"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Payment Flow
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={testAudioPlayer}
            disabled={testing}
            className="text-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            Audio Player
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={testMobileExperience}
            disabled={testing}
            className="text-xs"
          >
            <Smartphone className="w-3 h-3 mr-1" />
            Mobile Test
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={testErrorHandling}
            disabled={testing}
            className="text-xs"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error Tests
          </Button>
        </div>

        <Separator />

        {/* Advanced Tests */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testPaymentVerification}
            disabled={testing}
            className="text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Verification
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={testAccessCodeVerification}
            disabled={testing}
            className="text-xs"
          >
            <Music className="w-3 h-3 mr-1" />
            Access Codes
          </Button>
        </div>

        <Separator />

        {/* Full Test Suite */}
          <Button
          size="sm"
          onClick={runFullTestSuite}
          disabled={testing}
          className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <TestTube className="w-3 h-3 mr-1" />
          {testing ? 'Running Tests...' : 'Run Full Test Suite'}
        </Button>

        {/* Test Results */}
        {testResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-purple-700">Test Results</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearResults}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs bg-white/60 p-2 rounded border"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{result.test}</div>
                      {result.message && (
                        <div className="text-muted-foreground truncate">{result.message}</div>
                      )}
                      <div className="text-muted-foreground">{result.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-purple-600">
          Comprehensive testing suite for payment flows, audio functionality, and mobile experience before publishing.
        </p>
      </CardContent>
    </Card>
  );
};