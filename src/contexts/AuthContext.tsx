import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<any>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchingProfileRef = useRef(false);
  const lastProfileUserRef = useRef<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (fetchingProfileRef.current && lastProfileUserRef.current === userId) return;
    if (lastProfileUserRef.current === userId && userProfile) return;

    fetchingProfileRef.current = true;
    lastProfileUserRef.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      fetchingProfileRef.current = false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state change
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        captchaToken,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      // Generic error message to prevent user enumeration
      const msg = error.message.toLowerCase().includes('already')
        ? 'Unable to create account. Please try a different email or sign in.'
        : error.message;
      toast.error(msg);
    } else if (data.user && !data.session) {
      toast.success("Check your email for a verification link.");
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    if (error) {
      // Generic error to prevent user enumeration
      toast.error("Invalid email or password.");
    } else {
      toast.success("Welcome back! You have successfully signed in.");
    }

    return { data, error };
  };

  const signOut = async () => {
    try {
      // Force clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear state immediately (don't wait for Supabase)
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Attempt to sign out from Supabase (but don't let it block the process)
      try {
        const { error } = await supabase.auth.signOut();
        if (error && !error.message.includes('Session not found') && !error.message.includes('session')) {
          console.warn("Sign out warning:", error.message);
        }
      } catch (signOutError) {
        console.warn("Supabase sign out error (non-critical):", signOutError);
      }
      
      // Always show success since we've cleared local state
      toast.success("You have been successfully signed out.");
    } catch (error) {
      console.error('Sign out error:', error);
      // Even with errors, clear state and show success
      setUser(null);
      setUserProfile(null);
      setSession(null);
      toast.success("Signed out successfully.");
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};