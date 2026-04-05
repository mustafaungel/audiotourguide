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
      
      // Check if the guide exists in linkedGuides
      const guideExists = guideId === 'main' || linkedGuides.some(g => g.guide_id === guideId);
      
      if (guideExists) {
        // Guide exists, switch immediately
        setActiveTab(guideId);
        setPendingGuideId(null);
        onActiveTabChange?.(guideId);
        // Ensure sections are loaded for this guide
        if (guideId !== 'main') {
          ensureGuideSections(guideId);
        }
      } else {
        // Guide doesn't exist yet, set as pending and switch tab to show loading
        setPendingGuideId(guideId);
        setActiveTab(guideId);
        onActiveTabChange?.(guideId);
      }
      
      // Signal that the event was handled
      window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
    };

    const handleLanguageChange = async (e: CustomEvent) => {
      const { languageCode: newLanguageCode, guideId: targetGuideId } = (e as any).detail || {};
      
      console.log('🔄 MultiTabAudioPlayer: Language change event:', { 
        targetGuideId, 
        newLanguageCode,
        currentActiveTab: activeTab 
      });
      
      // Update language for this specific guide
      if (targetGuideId && newLanguageCode) {
        setLanguageByGuide(prev => ({ ...prev, [targetGuideId]: newLanguageCode }));
        
        // Reload sections with new language (stale-while-revalidate: keep old until new arrives)
        await ensureGuideSections(targetGuideId, newLanguageCode);
        
        // activeTab stays the same - no tab switch!
      }
    };

    window.addEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    window.addEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
      window.removeEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
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
  }, [activeTab, linkedGuides, accessCode]);

  const ensureGuideSections = async (guideId: string, overrideLanguage?: string) => {
    // Determine effective language: override > stored > default
    const effectiveLang = overrideLanguage || languageByGuide[guideId] || languageCode;
    
    // If override language, always reload. Otherwise skip if already loaded.
    if (!overrideLanguage && sectionsByGuide[guideId] && sectionsByGuide[guideId].length > 0) {
      console.log('MultiTabAudioPlayer: Skipping sections load for guide:', guideId, 'Already loaded');
      return;
    }
    if (!accessCode) {
      console.log('MultiTabAudioPlayer: No access code, skipping');
      return;
    }

    console.log('MultiTabAudioPlayer: Starting sections load for guide:', guideId, 'with language:', effectiveLang);

    try {
      let sectionsData: any[] = [];
      let fetchSuccess = false;

      // For main guide, use existing RPC
      if (guideId === mainGuide.id) {
        console.log('MultiTabAudioPlayer: Loading main guide sections via RPC');
        const { data, error } = await supabase
          .rpc('get_sections_with_access', {
            p_guide_id: guideId,
            p_access_code: accessCode.trim(),
            p_language_code: effectiveLang
          });

        if (!error && data && data.length > 0) {
          sectionsData = data;
          fetchSuccess = true;
          console.log('MultiTabAudioPlayer: Main guide sections loaded via RPC:', sectionsData.length);
        } else {
          console.warn('MultiTabAudioPlayer: Main guide RPC failed or returned empty:', error?.message || 'No sections');
        }
      } else {
        // For linked guides, try secure RPC first
        console.log('MultiTabAudioPlayer: Loading linked guide sections via RPC');
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
          console.log('MultiTabAudioPlayer: Linked guide sections loaded via RPC:', sectionsData.length);
        } else {
          console.warn('MultiTabAudioPlayer: Linked guide RPC failed or returned empty:', error?.message || 'No sections');
        }
      }

      // If RPC failed or returned empty, try direct fetch for requested language only
      if (!fetchSuccess) {
        console.log('MultiTabAudioPlayer: Attempting direct fetch for', effectiveLang);
        
        const { data: directData, error: directError } = await supabase
          .from('guide_sections')
          .select('*')
          .eq('guide_id', guideId)
          .eq('language_code', effectiveLang)
          .order('order_index');

        if (!directError && directData && directData.length > 0) {
          sectionsData = directData;
          fetchSuccess = true;
          console.log('MultiTabAudioPlayer: Direct fetch successful, sections:', sectionsData.length);
        } else {
          console.warn('MultiTabAudioPlayer: No sections found for language:', effectiveLang);
          sectionsData = [];
        }
      }

      // Set the sections data
      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionsData }));

      if (fetchSuccess) {
        console.log('MultiTabAudioPlayer: Successfully loaded', sectionsData.length, 'sections for guide:', guideId);
      } else {
        console.error('MultiTabAudioPlayer: Failed to load any sections for guide:', guideId);
      }

    } catch (error) {
      console.error('MultiTabAudioPlayer: Unexpected error loading sections for guide:', guideId, error);
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

  // Dynamic height lock: measure active content and lock wrapper min-height during transitions
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | undefined>(undefined);

  const handleTabChange = useCallback((value: string) => {
    // Lock current height before switching
    if (contentWrapperRef.current) {
      setLockedHeight(contentWrapperRef.current.offsetHeight);
    }
    const scrollY = window.scrollY;
    setActiveTab(value);
    onActiveTabChange?.(value);
    // Double-rAF: wait for React render + DOM paint, then unlock height
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        // Unlock height after paint so new content can size naturally
        setTimeout(() => setLockedHeight(undefined), 100);
      });
    });
  }, [onActiveTabChange]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* iOS-style horizontal scroll pill tabs */}
        <TabsList className="flex flex-wrap w-full mb-4 h-auto p-1 gap-2 bg-transparent">
          <TabsTrigger
            value="main"
            className="flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-muted/50 transition-all duration-200"
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[180px]">{mainGuide.title}</span>
            {mainSections.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 shrink-0 text-[10px] px-1.5 py-0 h-4 rounded-full">
                {mainSections.length}
              </Badge>
            )}
          </TabsTrigger>

          {linkedGuides.map((linkedGuide) => (
            <TabsTrigger
              key={linkedGuide.guide_id}
              value={linkedGuide.guide_id}
              className="flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-medium rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-muted/50 transition-all duration-200"
            >
              <Music className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{linkedGuide.custom_title || linkedGuide.title}</span>
              {(() => {
                const sectionCount = sectionsByGuide[linkedGuide.guide_id]?.length || 0;
                return sectionCount > 0 ? (
                  <Badge variant="secondary" className="ml-0.5 shrink-0 text-[10px] px-1.5 py-0 h-4 rounded-full">
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
              className="flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-medium rounded-full opacity-50 bg-muted/30"
            >
              <Music className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span>{t('loading', languageCode)}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* forceMount + hidden: prevent layout shift & re-mount */}
        <div
          ref={contentWrapperRef}
          className="relative"
          style={{ minHeight: lockedHeight ? `${lockedHeight}px` : '300px' }}
        >
          <TabsContent value="main" forceMount className={activeTab !== 'main' ? 'hidden' : 'mt-0'}>
            <NewSectionAudioPlayer
              guideId={mainGuide.id}
              guideTitle={mainGuide.title}
              sections={mainSections}
              mainAudioUrl={mainGuide.audio_url}
              lang={languageByGuide[mainGuide.id] || languageCode}
            />
          </TabsContent>

          {linkedGuides.map((linkedGuide) => (
            <TabsContent key={linkedGuide.guide_id} value={linkedGuide.guide_id} forceMount className={activeTab !== linkedGuide.guide_id ? 'hidden' : 'mt-0'}>
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
            <TabsContent value={pendingGuideId} forceMount className={activeTab !== pendingGuideId ? 'hidden' : 'mt-0'}>
              <AudioGuideLoader variant="inline" message={t('loadingGuide', languageCode)} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};