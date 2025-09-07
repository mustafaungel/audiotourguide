import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Download, Search, Clock, MapPin, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { EnhancedLibrary } from '@/components/EnhancedLibrary';

export default function Library() {
  const [purchasedGuides, setPurchasedGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [useEnhancedView, setUseEnhancedView] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPurchasedGuides();
    }
  }, [user]);

  const fetchPurchasedGuides = async () => {
    if (!user) return;

    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from('user_purchases')
        .select(`
          *,
          audio_guides (*)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (purchaseError) throw purchaseError;

      setPurchasedGuides(purchases || []);
    } catch (error) {
      console.error('Error fetching purchased guides:', error);
      toast({
        title: "Error",
        description: "Failed to load your library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGuide = (guide: any) => {
    // Placeholder for play functionality
    toast({
      title: "Playing Guide",
      description: `Now playing: ${guide.audio_guides?.title}`,
    });
  };

  const handleDownloadGuide = (guide: any) => {
    // Placeholder for download functionality
    toast({
      title: "Download Started",
      description: `Downloading: ${guide.audio_guides?.title}`,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">My Library</h1>
          <p className="text-muted-foreground mb-8">Please log in to view your purchased audio guides.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Library</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of purchased audio guides, ready for your next adventure
          </p>
        </div>

        {/* Enhanced Library Component */}
        {useEnhancedView ? (
          <EnhancedLibrary
            guides={purchasedGuides}
            onPlayGuide={handlePlayGuide}
            onDownloadGuide={handleDownloadGuide}
          />
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Your library is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start building your collection of audio guides
            </p>
            <Button asChild>
              <Link to="/">Explore Guides</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}