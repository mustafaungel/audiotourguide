import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './ui/badge';
import { Music } from 'lucide-react';
import { t } from '@/lib/translations';
import { AudioGuideLoader } from './AudioGuideLoader';

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
  onActiveTabChange?: (tabId: string) => void;
}

export const MultiTabAudioPlayer: React.FC<MultiTabAudioPlayerProps> = ({
  mainGuide,
  mainSections = [],
  accessCode,
  languageCode = 'en',
  onClose,
  onActiveTabChange
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [pendingGuideId, setPendingGuideId] = useState<string | null>(null);
  const [sectionsByGuide, setSectionsByGuide] = useState<Record<string, Section[]>>({});
  const [languageByGuide, setLanguageByGuide] = useState<Record<string, string>>({
    [mainGuide.id]: languageCode
  });
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const lockedHeightRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  // Centralized tab switch with layout lock
  const switchTab = useCallback((newTab: string) => {
    if (newTab === activeTab) return;
    
    // Lock current height
    if (contentWrapperRef.current) {
      lockedHeightRef.current = contentWrapperRef.current.offsetHeight;
      forceRender(n => n + 1);
    }
    
    const scrollY = window.scrollY;
    setActiveTab(newTab);
    onActiveTabChange?.(newTab);
    
    // Use ResizeObserver to unlock when new content settles
    if (contentWrapperRef.current) {
      const observer = new ResizeObserver(() => {
        // Content has rendered with new size — unlock
        window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        lockedHeightRef.current = null;
        forceRender(n => n + 1);
        observer.disconnect();
      });
      
      // Observe after React render
      requestAnimationFrame(() => {
        if (contentWrapperRef.current) {
          observer.observe(contentWrapperRef.current);
        }
        // Safety: unlock after 400ms even if observer doesn't fire
        setTimeout(() => {
          if (lockedHeightRef.current !== null) {
            window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
            lockedHeightRef.current = null;
            forceRender(n => n + 1);
          }
          observer.disconnect();
        }, 400);
      });
    }
  }, [activeTab, onActiveTabChange]);

  const handleTabChange = useCallback((value: string) => {
    switchTab(value);
  }, [switchTab]);

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id, accessCode]);

  // Sync main guide language when languageCode prop changes
  useEffect(() => {
    setLanguageByGuide(prev => ({ ...prev, [mainGuide.id]: languageCode }));
  }, [languageCode, mainGuide.id]);

  // Preload sections for all linked guides
  useEffect(() => {
    if (linkedGuides.length > 0 && accessCode) {
      linkedGuides.forEach(guide => {
        ensureGuideSections(guide.guide_id);
      });
    }
  }, [linkedGuides, accessCode]);

  // Add event listener for linked guide navigation
  useEffect(() => {
    const handleOpenLinkedGuide = (event: CustomEvent) => {
      const { guideId } = (event as any).detail || {};
      console.log('Switching to linked guide:', guideId);
      
      const guideExists = guideId === 'main' || linkedGuides.some(g => g.guide_id === guideId);
      
      if (guideExists) {
        switchTab(guideId);
        setPendingGuideId(null);
        if (guideId !== 'main') {
          ensureGuideSections(guideId);
        }
      } else {
        setPendingGuideId(guideId);
        switchTab(guideId);
      }
      
      window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
    };

    const handleLanguageChange = async (e: CustomEvent) => {
      const { languageCode: newLanguageCode, guideId: targetGuideId } = (e as any).detail || {};
      
      if (targetGuideId && newLanguageCode) {
        setLanguageByGuide(prev => ({ ...prev, [targetGuideId]: newLanguageCode }));
        await ensureGuideSections(targetGuideId, newLanguageCode);
      }
    };

    window.addEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    window.addEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
      window.removeEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
    };
  }, [linkedGuides, accessCode, switchTab]);

  // Ensure activeTab always points to a valid value
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
  }, [activeTab, linkedGuides, accessCode]);

  const ensureGuideSections = async (guideId: string, overrideLanguage?: string) => {
    const effectiveLang = overrideLanguage || languageByGuide[guideId] || languageCode;
    
    if (!overrideLanguage && sectionsByGuide[guideId] && sectionsByGuide[guideId].length > 0) {
      return;
    }
    if (!accessCode) return;

    try {
      let sectionsData: any[] = [];
      let fetchSuccess = false;

      if (guideId === mainGuide.id) {
        const { data, error } = await supabase
          .rpc('get_sections_with_access', {
            p_guide_id: guideId,
            p_access_code: accessCode.trim(),
            p_language_code: effectiveLang
          });

        if (!error && data && data.length > 0) {
          sectionsData = data;
          fetchSuccess = true;
        }
      } else {
        const { data, error } = await supabase
          .rpc('get_linked_guide_sections_with_access', {
            p_main_guide_id: mainGuide.id,
            p_access_code: accessCode.trim(),
            p_target_guide_id: guideId,
            p_language_code: effectiveLang
          });

        if (!error && data && data.length > 0) {
          sectionsData = data;
          fetchSuccess = true;
        }
      }

      if (!fetchSuccess) {
        const { data: directData, error: directError } = await supabase
          .from('guide_sections')
          .select('*')
          .eq('guide_id', guideId)
          .eq('language_code', effectiveLang)
          .order('order_index');

        if (!directError && directData && directData.length > 0) {
          sectionsData = directData;
          fetchSuccess = true;
        } else {
          sectionsData = [];
        }
      }

      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionsData }));
    } catch (error) {
      console.error('MultiTabAudioPlayer: Error loading sections:', error);
      setSectionsByGuide(prev => ({ ...prev, [guideId]: [] }));
    }
  };

  const loadLinkedGuides = async () => {
    if (!mainGuide?.id || !accessCode?.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: fullLinkedGuides, error: rpcError } = await supabase
        .rpc('get_full_linked_guides_with_access', {
          p_guide_id: mainGuide.id,
          p_access_code: accessCode.trim()
        });

      if (!rpcError && fullLinkedGuides && fullLinkedGuides.length > 0) {
        const processedGuides: LinkedGuide[] = fullLinkedGuides.map((linkedGuide: any) => ({
          guide_id: linkedGuide.guide_id,
          custom_title: linkedGuide.custom_title,
          order_index: linkedGuide.order_index || 0,
          title: linkedGuide.title,
          slug: linkedGuide.slug,
          master_access_code: linkedGuide.master_access_code,
          sections: []
        }));
        setLinkedGuides(processedGuides.sort((a, b) => a.order_index - b.order_index));
      } else {
        const { data: simpleLinkedGuides, error: fallbackError } = await supabase
          .rpc('get_linked_guides_with_access', {
            p_guide_id: mainGuide.id,
            p_access_code: accessCode.trim()
          });

        if (!fallbackError && simpleLinkedGuides && simpleLinkedGuides.length > 0) {
          const processedGuides: LinkedGuide[] = simpleLinkedGuides.map((linkedGuide: any) => ({
            guide_id: linkedGuide.guide_id,
            custom_title: linkedGuide.custom_title,
            order_index: linkedGuide.order_index || 0,
            title: linkedGuide.title,
            slug: linkedGuide.slug,
            master_access_code: linkedGuide.master_access_code,
            sections: []
          }));
          setLinkedGuides(processedGuides.sort((a, b) => a.order_index - b.order_index));
        } else {
          setLinkedGuides([]);
        }
      }
      
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
    return <AudioGuideLoader variant="inline" message={t('loading', languageCode)} />;
  }

  // If no linked guides, use the regular single player
  if (linkedGuides.length === 0) {
    return (
      <NewSectionAudioPlayer
        guideId={mainGuide.id}
        guideTitle={mainGuide.title}
        sections={mainSections}
        mainAudioUrl={mainGuide.audio_url}
        lang={languageCode}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Adaptive grid tab pills */}
        <TabsList className={`grid w-full mb-4 h-auto p-0 gap-2 bg-transparent ${
          linkedGuides.length === 1 ? 'grid-cols-2' : 'grid-cols-1'
        }`}>
          <TabsTrigger
            value="main"
            className="flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl border border-transparent bg-muted/50 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/30 data-[state=active]:scale-[1.01] active:scale-[0.97]"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Music className="w-4 h-4 shrink-0" />
              <span className="line-clamp-2 break-words text-left">{mainGuide.title}</span>
            </span>
            {mainSections.length > 0 && (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5 rounded-full tabular-nums">
                {mainSections.length}
              </Badge>
            )}
          </TabsTrigger>

          {linkedGuides.map((linkedGuide) => (
            <TabsTrigger
              key={linkedGuide.guide_id}
              value={linkedGuide.guide_id}
              className="flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl border border-transparent bg-muted/50 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/30 data-[state=active]:scale-[1.01] active:scale-[0.97]"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 shrink-0" />
                <span className="line-clamp-2 break-words text-left">{linkedGuide.custom_title || linkedGuide.title}</span>
              </span>
              {(() => {
                const sectionCount = sectionsByGuide[linkedGuide.guide_id]?.length || 0;
                return sectionCount > 0 ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5 rounded-full tabular-nums">
                    {sectionCount}
                  </Badge>
                ) : null;
              })()}
            </TabsTrigger>
          ))}

          {/* Pending guide pill */}
          {pendingGuideId && !linkedGuides.some(g => g.guide_id === pendingGuideId) && (
            <TabsTrigger
              value={pendingGuideId}
              disabled
              className="flex items-center gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl opacity-50 bg-muted/30"
            >
              <Music className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{t('loading', languageCode)}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Content wrapper with layout lock via ResizeObserver */}
        <div
          ref={contentWrapperRef}
          className="relative overflow-hidden"
          style={{ minHeight: lockedHeightRef.current ? `${lockedHeightRef.current}px` : '300px' }}
        >
          {/* Active panel renders normally; inactive panels are invisible but measurable */}
          <TabsContent value="main" forceMount className={activeTab !== 'main' ? 'absolute inset-0 invisible pointer-events-none' : 'mt-0'}>
            <NewSectionAudioPlayer
              guideId={mainGuide.id}
              guideTitle={mainGuide.title}
              sections={mainSections}
              mainAudioUrl={mainGuide.audio_url}
              lang={languageByGuide[mainGuide.id] || languageCode}
            />
          </TabsContent>

          {linkedGuides.map((linkedGuide) => (
            <TabsContent key={linkedGuide.guide_id} value={linkedGuide.guide_id} forceMount className={activeTab !== linkedGuide.guide_id ? 'absolute inset-0 invisible pointer-events-none' : 'mt-0'}>
              <NewSectionAudioPlayer
                guideId={linkedGuide.guide_id}
                guideTitle={linkedGuide.custom_title || linkedGuide.title}
                sections={sectionsByGuide[linkedGuide.guide_id] || []}
                mainAudioUrl=""
                lang={languageByGuide[linkedGuide.guide_id] || languageCode}
              />
            </TabsContent>
          ))}

          {/* Loading state for pending guide */}
          {pendingGuideId && !linkedGuides.some(g => g.guide_id === pendingGuideId) && (
            <TabsContent value={pendingGuideId} forceMount className={activeTab !== pendingGuideId ? 'absolute inset-0 invisible pointer-events-none' : 'mt-0'}>
              <AudioGuideLoader variant="inline" message={t('loadingGuide', languageCode)} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};
