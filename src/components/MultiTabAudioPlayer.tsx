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
  custom_title?: string;
  order_index: number;
  title: string;
  slug: string;
  master_access_code?: string;
  sections: Section[];
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
  }, [mainGuide.id, accessCode]);

  // Add event listener for linked guide navigation
  useEffect(() => {
    const handleOpenLinkedGuide = (event: CustomEvent) => {
      const { guideId } = (event as any).detail || {};
      const exists = guideId === 'main' || linkedGuides.some(g => g.guide_id === guideId);
      if (exists) {
        console.log('Switching to linked guide:', guideId);
        setActiveTab(guideId);
        // Signal that the event was handled
        window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
      } else {
        console.warn('[MultiTabAudioPlayer] Linked guide not found among loaded tabs; letting fallback navigation proceed', { guideId });
      }
    };

    window.addEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    return () => {
      window.removeEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    };
  }, [linkedGuides]);

  const loadLinkedGuides = async () => {
    if (!mainGuide?.id || !accessCode?.trim()) {
      console.log('MultiTabAudioPlayer: Missing guide ID or access code');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('MultiTabAudioPlayer: Loading linked guides for:', mainGuide.id);
      
      // Use the new comprehensive RPC that gets all data in one call
      const { data: fullLinkedGuides, error: rpcError } = await supabase
        .rpc('get_full_linked_guides_with_access', {
          p_guide_id: mainGuide.id,
          p_access_code: accessCode.trim()
        });

      console.log('MultiTabAudioPlayer: RPC call result:', { 
        hasData: !!fullLinkedGuides, 
        dataLength: fullLinkedGuides?.length || 0,
        hasError: !!rpcError,
        errorDetails: rpcError,
        accessCode: accessCode?.substring(0, 8) + '...'
      });

      if (rpcError) {
        console.error('MultiTabAudioPlayer: RPC error:', rpcError);
        setLinkedGuides([]);
        return;
      }

      if (fullLinkedGuides && fullLinkedGuides.length > 0) {
        console.log('MultiTabAudioPlayer: Found linked guides via new RPC:', fullLinkedGuides.length);
        
        const processedGuides: LinkedGuide[] = fullLinkedGuides.map((linkedGuide: any) => ({
          guide_id: linkedGuide.guide_id,
          custom_title: linkedGuide.custom_title,
          order_index: linkedGuide.order_index || 0,
          title: linkedGuide.title,
          slug: linkedGuide.slug,
          master_access_code: linkedGuide.master_access_code,
          sections: linkedGuide.sections || []
        }));

        console.log('MultiTabAudioPlayer: Final processed guides:', processedGuides.length);
        setLinkedGuides(processedGuides.sort((a, b) => a.order_index - b.order_index));
      } else {
        console.log('MultiTabAudioPlayer: No linked guides found');
        setLinkedGuides([]);
      }
    } catch (error) {
      console.error('MultiTabAudioPlayer: Unexpected error:', error);
      setLinkedGuides([]);
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
        {/* Mobile-optimized TabsList */}
        <TabsList className={`
          grid w-full mb-4 h-auto p-1 
          ${linkedGuides.length === 0 ? 'grid-cols-1' : 
            linkedGuides.length <= 2 ? `grid-cols-${linkedGuides.length + 1}` : 
            'grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }
        `}>
          <TabsTrigger 
            value="main" 
            className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Music className="w-4 h-4 shrink-0" />
            <span className="truncate">{mainGuide.title}</span>
            {mainSections.length > 0 && (
              <Badge variant="secondary" className="ml-1 shrink-0 text-xs">
                {mainSections.length}
              </Badge>
            )}
          </TabsTrigger>
          
          {linkedGuides.map((linkedGuide) => (
            <TabsTrigger 
              key={linkedGuide.guide_id} 
              value={linkedGuide.guide_id}
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Music className="w-4 h-4 shrink-0" />
              <span className="truncate">{linkedGuide.custom_title || linkedGuide.title}</span>
              {linkedGuide.sections && linkedGuide.sections.length > 0 && (
                <Badge variant="secondary" className="ml-1 shrink-0 text-xs">
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
              guideTitle={linkedGuide.custom_title || linkedGuide.title}
              sections={linkedGuide.sections || []}
              mainAudioUrl=""
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};