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
  languageCode?: string;
  onClose?: () => void;
}

export const MultiTabAudioPlayer: React.FC<MultiTabAudioPlayerProps> = ({
  mainGuide,
  mainSections = [],
  accessCode,
  languageCode = 'en',
  onClose
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [pendingGuideId, setPendingGuideId] = useState<string | null>(null);
  const [sectionsByGuide, setSectionsByGuide] = useState<Record<string, Section[]>>({});

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id, accessCode]);

  // Add event listener for linked guide navigation
  useEffect(() => {
    const handleOpenLinkedGuide = (event: CustomEvent) => {
      const { guideId } = (event as any).detail || {};
      console.log('Switching to linked guide:', guideId);
      
      // Check if the guide exists in linkedGuides
      const guideExists = guideId === 'main' || linkedGuides.some(g => g.guide_id === guideId);
      
      if (guideExists) {
        // Guide exists, switch immediately
        setActiveTab(guideId);
        setPendingGuideId(null);
        // Ensure sections are loaded for this guide
        if (guideId !== 'main') {
          ensureGuideSections(guideId);
        }
      } else {
        // Guide doesn't exist yet, set as pending and switch tab to show loading
        setPendingGuideId(guideId);
        setActiveTab(guideId);
      }
      
      // Signal that the event was handled
      window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
    };

    window.addEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    return () => {
      window.removeEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    };
  }, [linkedGuides, accessCode, languageCode]);

  // Ensure activeTab always points to a valid value to avoid Radix Tabs issues
  useEffect(() => {
    const allowedValues = ['main', ...linkedGuides.map(g => g.guide_id), ...(pendingGuideId ? [pendingGuideId] : [])];
    if (!allowedValues.includes(activeTab)) {
      setActiveTab('main');
    }
  }, [activeTab, linkedGuides, pendingGuideId]);

  // Load sections when activeTab changes
  useEffect(() => {
    if (activeTab !== 'main' && activeTab && linkedGuides.some(g => g.guide_id === activeTab)) {
      ensureGuideSections(activeTab);
    }
  }, [activeTab, linkedGuides, accessCode, languageCode]);

  const ensureGuideSections = async (guideId: string) => {
    if (sectionsByGuide[guideId] || !accessCode) {
      return; // Already loaded or no access code
    }

    try {
      console.log('MultiTabAudioPlayer: Loading sections for guide:', guideId);
      const { data: sectionsData, error } = await supabase
        .rpc('get_sections_with_access', {
          p_guide_id: guideId,
          p_access_code: accessCode.trim(),
          p_language_code: languageCode
        });

      if (error) {
        console.error('MultiTabAudioPlayer: Error loading sections:', error);
        setSectionsByGuide(prev => ({ ...prev, [guideId]: [] }));
        return;
      }

      console.log('MultiTabAudioPlayer: Sections loaded:', sectionsData?.length || 0);
      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionsData || [] }));
    } catch (error) {
      console.error('MultiTabAudioPlayer: Unexpected error loading sections:', error);
      setSectionsByGuide(prev => ({ ...prev, [guideId]: [] }));
    }
  };

  const loadLinkedGuides = async () => {
    if (!mainGuide?.id || !accessCode?.trim()) {
      console.log('MultiTabAudioPlayer: Missing guide ID or access code');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('MultiTabAudioPlayer: Loading linked guides for:', mainGuide.id);
      
      // Try the comprehensive RPC first
      const { data: fullLinkedGuides, error: rpcError } = await supabase
        .rpc('get_full_linked_guides_with_access', {
          p_guide_id: mainGuide.id,
          p_access_code: accessCode.trim()
        });

      console.log('MultiTabAudioPlayer: RPC call result:', { 
        hasData: !!fullLinkedGuides, 
        dataLength: fullLinkedGuides?.length || 0,
        hasError: !!rpcError,
        errorMessage: rpcError?.message,
        errorCode: rpcError?.code
      });

      if (!rpcError && fullLinkedGuides && fullLinkedGuides.length > 0) {
        console.log('MultiTabAudioPlayer: Found linked guides via comprehensive RPC:', fullLinkedGuides.length);
        
        const processedGuides: LinkedGuide[] = fullLinkedGuides.map((linkedGuide: any) => ({
          guide_id: linkedGuide.guide_id,
          custom_title: linkedGuide.custom_title,
          order_index: linkedGuide.order_index || 0,
          title: linkedGuide.title,
          slug: linkedGuide.slug,
          master_access_code: linkedGuide.master_access_code,
          sections: [] // We'll load sections separately for better control
        }));

        setLinkedGuides(processedGuides.sort((a, b) => a.order_index - b.order_index));
      } else {
        console.log('MultiTabAudioPlayer: Trying fallback RPC');
        
        // Fallback to simpler RPC
        const { data: simpleLinkedGuides, error: fallbackError } = await supabase
          .rpc('get_linked_guides_with_access', {
            p_guide_id: mainGuide.id,
            p_access_code: accessCode.trim()
          });

        if (!fallbackError && simpleLinkedGuides && simpleLinkedGuides.length > 0) {
          console.log('MultiTabAudioPlayer: Found linked guides via fallback RPC:', simpleLinkedGuides.length);
          
          const processedGuides: LinkedGuide[] = simpleLinkedGuides.map((linkedGuide: any) => ({
            guide_id: linkedGuide.guide_id,
            custom_title: linkedGuide.custom_title,
            order_index: linkedGuide.order_index || 0,
            title: linkedGuide.title,
            slug: linkedGuide.slug,
            master_access_code: linkedGuide.master_access_code,
            sections: [] // We'll load sections separately
          }));

          setLinkedGuides(processedGuides.sort((a, b) => a.order_index - b.order_index));
        } else {
          console.log('MultiTabAudioPlayer: No linked guides found in either RPC');
          setLinkedGuides([]);
        }
      }
      
      // Check if we have a pending guide that's now available
      if (pendingGuideId) {
        const guidesLoaded = linkedGuides.some(g => g.guide_id === pendingGuideId);
        if (guidesLoaded) {
          setPendingGuideId(null);
          ensureGuideSections(pendingGuideId);
        }
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
        <TabsList className="grid w-full mb-4 h-auto p-1 grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              {(() => {
                const sectionCount = sectionsByGuide[linkedGuide.guide_id]?.length || 0;
                return sectionCount > 0 ? (
                  <Badge variant="secondary" className="ml-1 shrink-0 text-xs">
                    {sectionCount}
                  </Badge>
                ) : null;
              })()}
            </TabsTrigger>
          ))}

          {/* Temporary trigger for pending guide to keep Tabs stable */}
          {pendingGuideId && !linkedGuides.some(g => g.guide_id === pendingGuideId) && (
            <TabsTrigger 
              value={pendingGuideId}
              disabled
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium opacity-70"
            >
              <Music className="w-4 h-4 shrink-0" />
              <span className="truncate">Loading...</span>
            </TabsTrigger>
          )}
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
              sections={sectionsByGuide[linkedGuide.guide_id] || []}
              mainAudioUrl=""
            />
          </TabsContent>
        ))}
        
        {/* Show loading state for pending guide */}
        {pendingGuideId && !linkedGuides.some(g => g.guide_id === pendingGuideId) && (
          <TabsContent value={pendingGuideId} className="mt-0">
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading guide...</span>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};