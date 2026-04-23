import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { Headphones, Sparkles, ShieldCheck } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="mobile-page-shell">
      <SEO
        title="Sign In"
        description="Sign in to your Audio Tour Guides account."
        noindex={true}
      />
      <Navigation />
      
      <main className="mobile-section">
        <div className="mobile-container max-w-5xl">
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
            <div className="discover-hero-panel flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full audio-premium-badge px-4 py-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your listening passport</span>
                </div>
                <div className="space-y-3">
                  <p className="mobile-kicker">Account access</p>
                  <h1 className="mobile-title text-foreground sm:text-[2.5rem]">Save guides, continue listening, return instantly.</h1>
                  <p className="mobile-body max-w-xl">
                    Sign in to keep your library ready, access premium purchases faster and move through destinations with a smoother audio-first mobile flow.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="editorial-stat-card">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Premium discovery</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Faster browse and return flow.</p>
                </div>
                <div className="editorial-stat-card">
                  <Headphones className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Listening continuity</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Keep your purchased guides close.</p>
                </div>
                <div className="editorial-stat-card">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Secure access</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Simple, fast and consistent on mobile.</p>
                </div>
              </div>
            </div>

            <Card className="mobile-surface-strong w-full overflow-hidden rounded-[28px] border-border/40">
              <CardHeader className="space-y-3 text-left">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/40 bg-background/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Audio Tour Guides
                </div>
                <div>
                  <CardTitle className="text-[1.75rem] font-extrabold leading-tight text-foreground">Join the journey</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Create an account or sign in to access your premium audio guide collection.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="signin" className="w-full space-y-5">
                <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-muted/70 p-1">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-border/50 bg-background/70 px-4"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-border/50 bg-background/70 px-4"
                      />
                    </div>
                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        required
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-border/50 bg-background/70 px-4"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-border/50 bg-background/70 px-4"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="h-12 rounded-2xl border-border/50 bg-background/70 px-4"
                      />
                    </div>
                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;