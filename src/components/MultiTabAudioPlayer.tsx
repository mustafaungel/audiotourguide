import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { GuideLanguageSelector } from './GuideLanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { Headphones, ChevronRight } from 'lucide-react';
import { t } from '@/lib/translations';
import { AudioGuideLoader } from './AudioGuideLoader';
import { BottomSheet } from './ui/bottom-sheet';
import { cn } from '@/lib/utils';

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

// In-memory cache: guideId+lang -> sections
const sectionCache = new Map<string, Section[]>();

export const MultiTabAudioPlayer: React.FC<MultiTabAudioPlayerProps> = ({
  mainGuide,
  mainSections = [],
  accessCode,
  languageCode = 'en',
  onClose,
  onActiveTabChange
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionsByGuide, setSectionsByGuide] = useState<Record<string, Section[]>>({});
  const [languageByGuide, setLanguageByGuide] = useState<Record<string, string>>({
    [mainGuide.id]: languageCode
  });
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id, accessCode]);

  // Sync main guide language from parent
  useEffect(() => {
    setLanguageByGuide(prev => ({ ...prev, [mainGuide.id]: languageCode }));
  }, [languageCode, mainGuide.id]);

  const ensureGuideSections = useCallback(async (guideId: string, overrideLanguage?: string) => {
    const effectiveLang = overrideLanguage || languageByGuide[guideId] || languageCode;
    const cacheKey = `${guideId}_${effectiveLang}`;

    if (sectionCache.has(cacheKey)) {
      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionCache.get(cacheKey)! }));
      return;
    }

    if (fetchingRef.current.has(cacheKey)) return;
    if (!accessCode) return;

    fetchingRef.current.add(cacheKey);

    try {
      let sectionsData: any[] = [];

      if (guideId === mainGuide.id) {
        const { data, error } = await supabase.rpc('get_sections_with_access', {
          p_guide_id: guideId, p_access_code: accessCode.trim(), p_language_code: effectiveLang
        });
        if (!error && data?.length > 0) sectionsData = data;
      } else {
        const { data, error } = await supabase.rpc('get_linked_guide_sections_with_access', {
          p_main_guide_id: mainGuide.id, p_access_code: accessCode.trim(),
          p_target_guide_id: guideId, p_language_code: effectiveLang
        });
        if (!error && data?.length > 0) sectionsData = data;
      }

      if (sectionsData.length === 0) {
        const { data, error } = await supabase.from('guide_sections')
          .select('*').eq('guide_id', guideId).eq('language_code', effectiveLang).order('order_index');
        if (!error && data?.length > 0) sectionsData = data;
      }

      sectionCache.set(cacheKey, sectionsData);
      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionsData }));
    } catch (error) {
      console.error('MultiTabAudioPlayer: Error loading sections:', error);
    } finally {
      fetchingRef.current.delete(cacheKey);
    }
  }, [accessCode, languageByGuide, languageCode, mainGuide.id]);

  const loadLinkedGuides = async () => {
    if (!mainGuide?.id || !accessCode?.trim()) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: fullLinkedGuides, error: rpcError } = await supabase
        .rpc('get_full_linked_guides_with_access', { p_guide_id: mainGuide.id, p_access_code: accessCode.trim() });

      if (!rpcError && fullLinkedGuides?.length > 0) {
        const processed: LinkedGuide[] = fullLinkedGuides.map((g: any) => ({
          guide_id: g.guide_id, custom_title: g.custom_title, order_index: g.order_index || 0,
          title: g.title, slug: g.slug, master_access_code: g.master_access_code, sections: []
        }));
        setLinkedGuides(processed.sort((a, b) => a.order_index - b.order_index));
      } else {
        const { data: simple, error: fallbackError } = await supabase
          .rpc('get_linked_guides_with_access', { p_guide_id: mainGuide.id, p_access_code: accessCode.trim() });
        if (!fallbackError && simple?.length > 0) {
          const processed: LinkedGuide[] = simple.map((g: any) => ({
            guide_id: g.guide_id, custom_title: g.custom_title, order_index: g.order_index || 0,
            title: g.title, slug: g.slug, master_access_code: g.master_access_code, sections: []
          }));
          setLinkedGuides(processed.sort((a, b) => a.order_index - b.order_index));
        } else {
          setLinkedGuides([]);
        }
      }
    } catch (error) {
      console.error('MultiTabAudioPlayer: Unexpected error:', error);
      setLinkedGuides([]);
    } finally {
      setLoading(false);
    }
  };

  // Listen for openLinkedGuide events
  useEffect(() => {
    const handleOpenLinkedGuide = (event: CustomEvent) => {
      const { guideId } = (event as any).detail || {};
      if (guideId === 'main') {
        setSelectedGuideId(mainGuide.id);
        setSheetOpen(true);
        return;
      }
      const guide = linkedGuides.find(g => g.guide_id === guideId);
      if (guide) {
        ensureGuideSections(guide.guide_id);
        setSelectedGuideId(guide.guide_id);
        setSheetOpen(true);
      }
      window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
    };

    const handleLanguageChange = async (e: CustomEvent) => {
      const { languageCode: newLang, guideId: targetId } = (e as any).detail || {};
      if (targetId && newLang && targetId !== mainGuide.id) {
        setLanguageByGuide(prev => ({ ...prev, [targetId]: newLang }));
        await ensureGuideSections(targetId, newLang);
      }
    };

    window.addEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
    window.addEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('openLinkedGuide', handleOpenLinkedGuide as EventListener);
      window.removeEventListener('changeGuideLanguage', handleLanguageChange as EventListener);
    };
  }, [linkedGuides, accessCode, mainGuide.id, ensureGuideSections]);

  const handlePillClick = useCallback((guideId: string) => {
    if (guideId !== mainGuide.id) {
      ensureGuideSections(guideId);
    }
    setSelectedGuideId(guideId);
    setSheetOpen(true);
    onActiveTabChange?.(guideId === mainGuide.id ? 'main' : guideId);
  }, [mainGuide.id, ensureGuideSections, onActiveTabChange]);

  const handleSheetClose = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedGuideId(null);
      onActiveTabChange?.('main');
    }
  }, [onActiveTabChange]);

  const sheetTitle = useMemo(() => {
    if (!selectedGuideId) return undefined;
    if (selectedGuideId === mainGuide.id) return mainGuide.title;
    const linked = linkedGuides.find(g => g.guide_id === selectedGuideId);
    return linked?.custom_title || linked?.title;
  }, [selectedGuideId, mainGuide, linkedGuides]);

  const sheetSections = useMemo(() => {
    if (!selectedGuideId) return [];
    if (selectedGuideId === mainGuide.id) return mainSections;
    return sectionsByGuide[selectedGuideId] || [];
  }, [selectedGuideId, mainGuide.id, mainSections, sectionsByGuide]);

  const sheetAudioUrl = useMemo(() => {
    if (selectedGuideId === mainGuide.id) return mainGuide.audio_url || '';
    return '';
  }, [selectedGuideId, mainGuide]);

  // Compute section count for each guide (from cache or live data)
  const getSectionCount = useCallback((guideId: string): number | null => {
    if (guideId === mainGuide.id) return mainSections.length || null;
    const cached = sectionsByGuide[guideId];
    if (cached) return cached.length;
    // Check in-memory cache
    const lang = languageByGuide[guideId] || languageCode;
    const cacheKey = `${guideId}_${lang}`;
    const fromCache = sectionCache.get(cacheKey);
    if (fromCache) return fromCache.length;
    return null;
  }, [mainGuide.id, mainSections, sectionsByGuide, languageByGuide, languageCode]);

  // Compute total duration for sheet header
  const sheetMeta = useMemo(() => {
    const secs = sheetSections.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const mins = Math.floor(secs / 60);
    return { chapters: sheetSections.length, duration: mins };
  }, [sheetSections]);

  // Handle language change from within BottomSheet
  const handleSheetLanguageChange = useCallback((newLang: string) => {
    if (!selectedGuideId) return;
    if (selectedGuideId === mainGuide.id) {
      // For main guide, dispatch to page-level handler
      setLanguageByGuide(prev => ({ ...prev, [mainGuide.id]: newLang }));
      // The page's handleLanguageChange will be called via the GuideLanguageSelector's onLanguageChange
    } else {
      // For linked guides, use existing event system
      window.dispatchEvent(new CustomEvent('changeGuideLanguage', {
        detail: { guideId: selectedGuideId, languageCode: newLang }
      }));
    }
  }, [selectedGuideId, mainGuide.id]);

  if (loading && mainSections.length === 0) {
    return <AudioGuideLoader variant="inline" message={t('loading', languageCode)} />;
  }

  if (linkedGuides.length === 0) {
    return (
      <NewSectionAudioPlayer
        key={mainGuide.id}
        guideId={mainGuide.id} guideTitle={mainGuide.title}
        sections={mainSections} mainAudioUrl={mainGuide.audio_url}
        lang={languageByGuide[mainGuide.id] || languageCode}
      />
    );
  }

  const isMainSelected = selectedGuideId === mainGuide.id && sheetOpen;

  // Mini waveform decoration component
  const MiniWaveform = ({ active }: { active: boolean }) => (
    <div className="flex items-end gap-[2px] h-4 shrink-0">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-300",
            active
              ? "bg-primary-foreground animate-pulse"
              : "bg-primary/40"
          )}
          style={{
            height: `${i === 2 ? 16 : i === 1 ? 10 : 12}px`,
            animationDelay: active ? `${i * 150}ms` : '0ms',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Premium Audio Card Buttons */}
      <div className="flex flex-col w-full mb-4 gap-0">
        {/* Main guide card */}
        <button
          className={cn(
            "group relative flex items-center gap-3 min-h-[56px] px-4 py-3 text-base font-medium transition-all active:scale-[0.98] overflow-hidden",
            "rounded-t-2xl border-b border-border/20",
            isMainSelected
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg audio-card-glow"
              : "bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-primary/5"
          )}
          onClick={() => handlePillClick(mainGuide.id)}
        >
          <MiniWaveform active={isMainSelected} />
          <Headphones className={cn("w-4 h-4 shrink-0", isMainSelected ? "text-primary-foreground" : "text-primary")} />
          <span className="flex-1 line-clamp-2 break-words text-left">{mainGuide.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            {getSectionCount(mainGuide.id) && (
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isMainSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                {getSectionCount(mainGuide.id)} ch
              </span>
            )}
            <ChevronRight className={cn("w-4 h-4 opacity-50", isMainSelected ? "text-primary-foreground" : "")} />
          </div>
        </button>

        {/* Linked guide cards */}
        {linkedGuides.map((guide, index) => {
          const isSelected = selectedGuideId === guide.guide_id && sheetOpen;
          const isLast = index === linkedGuides.length - 1;
          const count = getSectionCount(guide.guide_id);
          return (
            <button
              key={guide.guide_id}
              onClick={() => handlePillClick(guide.guide_id)}
              className={cn(
                "group relative flex items-center gap-3 min-h-[56px] px-4 py-3 text-base font-medium transition-all active:scale-[0.98] overflow-hidden",
                isLast ? "rounded-b-2xl" : "border-b border-border/20",
                !isLast && "border-x border-border/40",
                isLast && "border border-t-0 border-border/40",
                !isLast && !isSelected && "border-t-0",
                isSelected
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg audio-card-glow border-primary/50"
                  : "bg-card/80 backdrop-blur-sm hover:bg-primary/5"
              )}
            >
              <MiniWaveform active={isSelected} />
              <Headphones className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary-foreground" : "text-primary")} />
              <span className="flex-1 line-clamp-2 break-words text-left">{guide.custom_title || guide.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                {count !== null && (
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {count} ch
                  </span>
                )}
                <ChevronRight className={cn("w-4 h-4 opacity-50", isSelected ? "text-primary-foreground" : "")} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom sheet for all guides */}
      <BottomSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        title={sheetTitle}
        defaultSnap="half"
        snapPoints={['half', 'full']}
      >
        {selectedGuideId && (
          <div className="space-y-3">
            {/* Sheet header meta */}
            <div className="flex items-center gap-2 px-1">
              <Headphones className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground line-clamp-1">{sheetTitle}</span>
              {sheetMeta.chapters > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full ml-auto shrink-0">
                  {sheetMeta.chapters} ch · {sheetMeta.duration} {t('min', languageCode)}
                </span>
              )}
            </div>

            {/* Compact inline language selector for this guide */}
            <div className="border-b border-border/20 pb-3">
              <GuideLanguageSelector
                guideId={mainGuide.id}
                selectedLanguage={languageByGuide[selectedGuideId] || languageCode}
                onLanguageChange={handleSheetLanguageChange}
                activeGuideId={selectedGuideId}
              />
            </div>

            {/* Player */}
            <NewSectionAudioPlayer
              key={selectedGuideId}
              guideId={selectedGuideId}
              guideTitle={sheetTitle || ''}
              sections={sheetSections}
              mainAudioUrl={sheetAudioUrl}
              lang={languageByGuide[selectedGuideId] || languageCode}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
