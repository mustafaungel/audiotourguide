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
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator';
import { AudioCacheManager } from '@/components/AudioCacheManager';

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
    const guideId = guide.audio_guides?.id || guide.guide_id;
    const accessCode = guide.access_code;
    
    if (guideId) {
      // Navigate to access page with access code
      const url = `/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`;
      window.location.href = url;
    } else {
      toast({
        title: "Error",
        description: "Guide not found",
        variant: "destructive",
      });
    }
  };

  const handleDownloadGuide = async (guide: any) => {
    try {
      const guideData = guide.audio_guides;
      if (!guideData?.audio_url) {
        toast({
          title: "Download Unavailable",
          description: "Audio file not available for download",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = guideData.audio_url;
      link.download = `${guideData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${guideData.title}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download the audio guide",
        variant: "destructive",
      });
    }
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
      <OfflineStatusIndicator />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Library</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of purchased audio guides, ready for your next adventure
          </p>
        </div>

        {/* Offline Cache Manager */}
        <div className="mb-8 max-w-md mx-auto">
          <AudioCacheManager />
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