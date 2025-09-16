import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './ui/badge';
import { Music } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
}

interface LinkedGuide {
  guide_id: string;
  custom_title: string;
  order: number;
  guide?: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    image_url?: string;
  };
  sections?: Section[];
}

interface MultiTabAudioPlayerProps {
  mainGuide: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    image_url?: string;
  };
  mainSections?: Section[];
  accessCode?: string;
  onClose?: () => void;
}

export const MultiTabAudioPlayer: React.FC<MultiTabAudioPlayerProps> = ({
  mainGuide,
  mainSections = [],
  accessCode,
  onClose
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id]);

  const loadLinkedGuides = async () => {
    try {
      // Load collection
      const { data: collection, error: collectionError } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', mainGuide.id)
        .maybeSingle();

      if (collectionError) throw collectionError;

      if (collection?.linked_guides) {
        const guides = collection.linked_guides as unknown as LinkedGuide[];
        
        // Load guide details for each linked guide
        const guideIds = guides.map(g => g.guide_id);
        if (guideIds.length > 0) {
          const { data: guideDetails, error: detailsError } = await supabase
            .from('audio_guides')
            .select('id, title, description, audio_url, image_url')
            .in('id', guideIds);

          if (!detailsError) {
            // Load sections for each linked guide
            const guidesWithDetails = await Promise.all(
              guides.map(async (linkedGuide) => {
                const guideDetail = guideDetails.find(d => d.id === linkedGuide.guide_id);
                
                // Load sections for this guide
                const { data: sections } = await supabase
                  .rpc('get_sections_with_access', {
                    p_guide_id: linkedGuide.guide_id,
                    p_access_code: accessCode || '',
                    p_language_code: 'en'
                  });

                return {
                  ...linkedGuide,
                  guide: guideDetail,
                  sections: sections || []
                };
              })
            );

            setLinkedGuides(guidesWithDetails.sort((a, b) => a.order - b.order));
          }
        }
      }
    } catch (error) {
      console.error('Error loading linked guides:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no linked guides, use the regular single player
  if (linkedGuides.length === 0) {
    return (
      <NewSectionAudioPlayer
        guideId={mainGuide.id}
        guideTitle={mainGuide.title}
        sections={mainSections}
        mainAudioUrl={mainGuide.audio_url}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-auto mb-4" style={{
          gridTemplateColumns: `repeat(${linkedGuides.length + 1}, minmax(0, 1fr))`
        }}>
          <TabsTrigger value="main" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            {mainGuide.title}
            {mainSections.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {mainSections.length}
              </Badge>
            )}
          </TabsTrigger>
          
          {linkedGuides.map((linkedGuide) => (
            <TabsTrigger 
              key={linkedGuide.guide_id} 
              value={linkedGuide.guide_id}
              className="flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              {linkedGuide.custom_title}
              {linkedGuide.sections && linkedGuide.sections.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {linkedGuide.sections.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="main" className="mt-0">
          <NewSectionAudioPlayer
            guideId={mainGuide.id}
            guideTitle={mainGuide.title}
            sections={mainSections}
            mainAudioUrl={mainGuide.audio_url}
          />
        </TabsContent>

        {linkedGuides.map((linkedGuide) => (
          <TabsContent key={linkedGuide.guide_id} value={linkedGuide.guide_id} className="mt-0">
            <NewSectionAudioPlayer
              guideId={linkedGuide.guide_id}
              guideTitle={linkedGuide.custom_title}
              sections={linkedGuide.sections || []}
              mainAudioUrl={linkedGuide.guide?.audio_url}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};