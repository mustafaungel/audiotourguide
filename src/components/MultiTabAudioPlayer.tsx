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
  master_access_code?: string;
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
    try {
      // Try secure RPC first (works for private guides when user has access)
      if (accessCode) {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_linked_guides_with_access', {
            p_guide_id: mainGuide.id,
            p_access_code: accessCode,
          });

        if (rpcError) {
          console.warn('[MultiTabAudioPlayer] RPC get_linked_guides_with_access error:', rpcError);
        }

        if (!rpcError && rpcData && rpcData.length > 0) {
          // Load sections for each linked guide using access-aware RPC
          const guidesWithDetails = await Promise.all(
            rpcData.map(async (linked: any) => {
              const effectiveCode = linked.master_access_code || accessCode;
              const { data: sections, error: secErr } = await supabase
                .rpc('get_sections_with_access', {
                  p_guide_id: linked.guide_id,
                  p_access_code: effectiveCode,
                  p_language_code: 'en'
                });
              if (secErr) {
                console.warn('[MultiTabAudioPlayer] RPC get_sections_with_access error for linked guide:', { guide_id: linked.guide_id, secErr });
              }
              return {
                guide_id: linked.guide_id,
                custom_title: linked.custom_title,
                order: linked.order_index,
                master_access_code: linked.master_access_code,
                guide: {
                  id: linked.guide_id,
                  title: linked.title,
                },
                sections: sections || []
              } as LinkedGuide;
            })
          );

          setLinkedGuides(guidesWithDetails.sort((a, b) => a.order - b.order));
          return; // Done
        } else if (!rpcError) {
          console.warn('[MultiTabAudioPlayer] RPC returned no linked guides; falling back to public tables');
        }
      }

      // Fallback to public tables (published + approved only)
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
                  .from('guide_sections')
                  .select('*')
                  .eq('guide_id', linkedGuide.guide_id)
                  .eq('language_code', 'en');

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
              <span className="truncate">{linkedGuide.custom_title}</span>
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