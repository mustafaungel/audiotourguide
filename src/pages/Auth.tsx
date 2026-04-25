import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { Headphones } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const { error } = await signIn(email, password);
    if (!error) navigate('/');
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
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Sign In" description="Sign in to your Audio Tour Guides account." noindex />
      <Navigation />

      {/* Centered minimal auth — pb-32 ensures content clears the mobile bottom nav */}
      <main className="flex-1 flex items-center justify-center px-5 pt-8 pb-32 md:pb-12">
        <div className="w-full max-w-sm">
          {/* Brand mark */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to continue your audio journey
            </p>
          </div>

          {/* Auth card */}
          <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-sm">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/60 p-1 mb-5">
                <TabsTrigger value="signin" className="rounded-lg text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-muted-foreground">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full mt-1" disabled={isLoading}>
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-medium text-muted-foreground">Full name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-muted-foreground">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="At least 6 characters"
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 text-base"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full mt-1" disabled={isLoading}>
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
