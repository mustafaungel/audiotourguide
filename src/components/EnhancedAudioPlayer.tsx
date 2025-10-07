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
  selectedLanguage?: string;
  onClose?: () => void;
  defaultStyle?: 'spotify' | 'classic';
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  guide,
  sections = [],
  accessCode,
  selectedLanguage = 'en',
  onClose,
  defaultStyle = 'spotify'
}) => {
  const [playerStyle] = useState<'spotify' | 'classic'>('spotify');
  const [showPlayer] = useState(true);
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

  // Player now starts directly without selection screen

  const handleClose = () => {
    onClose?.();
  };

  // If there are linked guides, use the multi-tab player
  if (hasLinkedGuides) {
    return (
      <MultiTabAudioPlayer
        mainGuide={guide}
        mainSections={sections}
        accessCode={accessCode}
        languageCode={selectedLanguage}
        onClose={handleClose}
      />
    );
  }

  return (
    <>
      {playerStyle === 'spotify' ? (
        <SpotifyStylePlayer
          key={`${guide.id}-${selectedLanguage}-${sections.map(s => s.id).join('-')}`}
          guide={guide}
          sections={sections}
          accessCode={accessCode}
          onClose={handleClose}
        />
      ) : (
        <LibraryAudioPlayer
          key={`${guide.id}-${selectedLanguage}-${sections.map(s => s.id).join('-')}`}
          guide={guide}
          accessCode={accessCode}
          onClose={handleClose}
        />
      )}
    </>
  );
};