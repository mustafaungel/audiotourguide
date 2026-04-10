import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Share2, Facebook, Twitter, Instagram, MessageCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SocialShareProps {
  title: string;
  description: string;
  url?: string;
  guide?: {
    id: string;
    title: string;
    location: string;
    image_url?: string;
  };
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
  title, 
  description, 
  url: urlProp,
  guide 
}) => {
  // Use edge function URL for guide sharing so crawlers get proper OG tags
  const url = guide?.id
    ? `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/og-image?id=${guide.id}`
    : (urlProp || window.location.href);
  const { toast } = useToast();

  const shareData = {
    title,
    text: description,
    url
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ 
        title: "Link copied!", 
        description: "Share this amazing audio guide with your friends!" 
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const encodedUrl = encodeURIComponent(url);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDescription}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=AudioGuides,Travel,Heritage`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      instagram: `https://instagram.com/` // Instagram doesn't support direct URL sharing
    };

    if (platform === 'instagram') {
      toast({ 
        title: "Share on Instagram", 
        description: "Copy the link and share it in your Instagram story or bio!" 
      });
      handleCopyLink();
      return;
    }

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      // Track viral sharing for analytics
      if (guide) {
        trackViralShare(guide.id, platform);
      }
    }
  };

  const trackViralShare = async (guideId: string, platform: string) => {
    try {
      await supabase.functions.invoke('track-viral-engagement', {
        body: {
          action: 'share',
          guide_id: guideId,
          platform: platform,
          metadata: { 
            location: window.location.href,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      const viralMessages = [
        "🔥 You're helping this destination go viral!",
        "🌟 Your share might inspire someone's next adventure!",
        "✈️ Spreading wanderlust one share at a time!",
        "🗺️ Thanks for sharing the love of travel!"
      ];
      
      setTimeout(() => {
        toast({
          title: viralMessages[Math.floor(Math.random() * viralMessages.length)],
          description: "Keep sharing to unlock exclusive travel badges!"
        });
      }, 2000);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  return (
    <Card className="p-4 bg-gradient-card border-tourism-warm/20">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="h-4 w-4 text-tourism-warm" />
        <span className="text-sm font-medium text-foreground">Share this amazing destination</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex items-center gap-2 border-tourism-warm/20 hover:bg-tourism-warm/10"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline">Share</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareToSocial('facebook')}
          className="flex items-center gap-2 border-blue-500/20 hover:bg-blue-500/10 text-blue-600"
        >
          <Facebook className="h-4 w-4" />
          <span className="hidden md:inline">Facebook</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareToSocial('twitter')}
          className="flex items-center gap-2 border-sky-500/20 hover:bg-sky-500/10 text-sky-600"
        >
          <Twitter className="h-4 w-4" />
          <span className="hidden md:inline">Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareToSocial('whatsapp')}
          className="flex items-center gap-2 border-green-500/20 hover:bg-green-500/10 text-green-600"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden md:inline">WhatsApp</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareToSocial('instagram')}
          className="flex items-center gap-2 border-pink-500/20 hover:bg-pink-500/10 text-pink-600"
        >
          <Instagram className="h-4 w-4" />
          <span className="hidden md:inline">Instagram</span>
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="w-full mt-2 text-muted-foreground hover:text-tourism-warm"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
    </Card>
  );
};