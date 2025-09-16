import React, { useState, useEffect } from 'react';
import { SpotifyStylePlayer } from './SpotifyStylePlayer';
import { LibraryAudioPlayer } from './LibraryAudioPlayer';
import { MultiTabAudioPlayer } from './MultiTabAudioPlayer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Music, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
}

interface EnhancedAudioPlayerProps {
  guide: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    image_url?: string;
  };
  sections?: Section[];
  accessCode?: string;
  onClose?: () => void;
  defaultStyle?: 'spotify' | 'classic';
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  guide,
  sections = [],
  accessCode,
  onClose,
  defaultStyle = 'spotify'
}) => {
  const [playerStyle, setPlayerStyle] = useState<'spotify' | 'classic'>(defaultStyle);
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasLinkedGuides, setHasLinkedGuides] = useState(false);

  useEffect(() => {
    checkForLinkedGuides();
  }, [guide.id]);

  const checkForLinkedGuides = async () => {
    try {
      // Try RPC with access code first (works for private guides via link)
      if (accessCode) {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_linked_guides_with_access', {
            p_guide_id: guide.id,
            p_access_code: accessCode,
          });
        if (!rpcError && rpcData && rpcData.length > 0) {
          setHasLinkedGuides(true);
          return;
        }
      }

      // Fallback to public table (only for published + approved guides)
      const { data, error } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', guide.id)
        .maybeSingle();

      if (!error && data?.linked_guides) {
        const guides = data.linked_guides as unknown as any[];
        setHasLinkedGuides(guides.length > 0);
      }
    } catch (error) {
      console.error('Error checking for linked guides:', error);
    }
  };

  if (!showPlayer) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-card border border-border/50 shadow-tourism">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground">
            <Music className="w-5 h-5" />
            Audio Player
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground">{guide.title}</h3>
            <p className="text-sm text-muted-foreground">
              {sections.length > 0 ? `${sections.length} chapters available` : 'Main audio track'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-center text-muted-foreground">
              Choose your experience:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  setPlayerStyle('spotify');
                  setShowPlayer(true);
                }}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground"
              >
                <Headphones className="w-6 h-6" />
                <span className="text-xs font-medium">Modern Player</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setPlayerStyle('classic');
                  setShowPlayer(true);
                }}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Music className="w-6 h-6" />
                <span className="text-xs font-medium">Classic Player</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClose = () => {
    setShowPlayer(false);
    onClose?.();
  };

  // If there are linked guides, use the multi-tab player
  if (hasLinkedGuides) {
    return (
      <MultiTabAudioPlayer
        mainGuide={guide}
        mainSections={sections}
        accessCode={accessCode}
        onClose={handleClose}
      />
    );
  }

  return (
    <>
      {playerStyle === 'spotify' ? (
        <SpotifyStylePlayer
          guide={guide}
          sections={sections}
          accessCode={accessCode}
          onClose={handleClose}
        />
      ) : (
        <LibraryAudioPlayer
          guide={guide}
          accessCode={accessCode}
          onClose={handleClose}
        />
      )}
    </>
  );
};