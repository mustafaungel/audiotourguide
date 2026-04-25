import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { Headphones, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Turnstile } from '@/components/auth/Turnstile';
import {
  signUpSchema,
  signInSchema,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from '@/lib/auth-validation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cloudflare Turnstile site key fetched from edge function (single source of truth)
const FALLBACK_TEST_KEY = '1x00000000000000000000AA';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Captcha tokens (separate per tab)
  const [signInCaptcha, setSignInCaptcha] = useState('');
  const [signUpCaptcha, setSignUpCaptcha] = useState('');

  // Site key loaded from server (so we don't depend on VITE_ build-time env)
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>(
    (import.meta.env.VITE_turnstileSiteKey as string) || ''
  );

  // Live password value for strength meter
  const [signUpPassword, setSignUpPassword] = useState('');

  // Show/hide password
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [showSignUpPass, setShowSignUpPass] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Fetch site key from server on mount
  useEffect(() => {
    if (turnstileSiteKey) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-turnstile', {
          method: 'GET' as any,
        });
        if (!error && data?.siteKey) {
          setTurnstileSiteKey(data.siteKey);
        } else {
          setTurnstileSiteKey(FALLBACK_TEST_KEY);
        }
      } catch {
        setTurnstileSiteKey(FALLBACK_TEST_KEY);
      }
    })();
  }, [turnstileSiteKey]);

  // Server-side captcha verification (extra layer beyond Supabase native check)
  const verifyCaptchaServerSide = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token, action: activeTab },
      });
      if (error || !data?.success) return false;
      return true;
    } catch {
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const limit = checkRateLimit('signin');
    if (!limit.allowed) {
      toast.error(`Too many attempts. Please wait ${Math.ceil((limit.retryAfter ?? 0) / 60)} minute(s).`);
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      captchaToken: signInCaptcha,
    };

    const parsed = signInSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    // Server-side captcha verification
    const captchaOk = await verifyCaptchaServerSide(parsed.data.captchaToken);
    if (!captchaOk) {
      toast.error('Security check failed. Please try again.');
      setSignInCaptcha('');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(parsed.data.email, parsed.data.password, parsed.data.captchaToken);
    if (error) {
      recordFailedAttempt('signin');
      setSignInCaptcha('');
    } else {
      clearRateLimit('signin');
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const limit = checkRateLimit('signup');
    if (!limit.allowed) {
      toast.error(`Too many attempts. Please wait ${Math.ceil((limit.retryAfter ?? 0) / 60)} minute(s).`);
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      website: (formData.get('website') as string) || '', // honeypot
      captchaToken: signUpCaptcha,
    };

    const parsed = signUpSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const captchaOk = await verifyCaptchaServerSide(parsed.data.captchaToken);
    if (!captchaOk) {
      toast.error('Security check failed. Please try again.');
      setSignUpCaptcha('');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(
      parsed.data.email,
      parsed.data.password,
      parsed.data.fullName,
      parsed.data.captchaToken
    );
    if (error) {
      recordFailedAttempt('signup');
      setSignUpCaptcha('');
    } else {
      clearRateLimit('signup');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Sign In" description="Sign in to your Audio Tour Guides account." noindex />
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-5 pt-8 pb-32 md:pb-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to continue your audio journey
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-sm">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/60 p-1 mb-5">
                <TabsTrigger value="signin" className="rounded-lg text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-3.5" autoComplete="on">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showSignInPass ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="h-12 rounded-xl border-border/60 bg-background px-4 pr-11 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showSignInPass ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showSignInPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onVerify={setSignInCaptcha}
                    onExpire={() => setSignInCaptcha('')}
                    onError={() => setSignInCaptcha('')}
                  />

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full mt-1"
                    disabled={isLoading || !signInCaptcha}
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-3.5" autoComplete="on">
                  {/* Honeypot — hidden from users, bots will fill it */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-muted-foreground">Full name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      required
                      disabled={isLoading}
                      maxLength={100}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      maxLength={254}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showSignUpPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        required
                        disabled={isLoading}
                        minLength={8}
                        maxLength={128}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="h-12 rounded-xl border-border/60 bg-background px-4 pr-11 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showSignUpPass ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showSignUpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={signUpPassword} className="pt-1" />
                  </div>

                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onVerify={setSignUpCaptcha}
                    onExpire={() => setSignUpCaptcha('')}
                    onError={() => setSignUpCaptcha('')}
                  />

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full mt-1"
                    disabled={isLoading || !signUpCaptcha}
                  >
                    {isLoading ? 'Creating account…' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our terms and privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
