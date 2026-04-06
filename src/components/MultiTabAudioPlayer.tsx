import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Music, ChevronRight } from 'lucide-react';
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

  // Sync main guide language from parent — do NOT eagerly fetch linked guides
  useEffect(() => {
    setLanguageByGuide(prev => ({ ...prev, [mainGuide.id]: languageCode }));
  }, [languageCode, mainGuide.id]);

  const ensureGuideSections = useCallback(async (guideId: string, overrideLanguage?: string) => {
    const effectiveLang = overrideLanguage || languageByGuide[guideId] || languageCode;
    const cacheKey = `${guideId}_${effectiveLang}`;

    // Return cached data instantly
    if (sectionCache.has(cacheKey)) {
      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionCache.get(cacheKey)! }));
      return;
    }

    // Prevent duplicate in-flight requests
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

      // Only fallback on empty result, not as normal path
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

    // Only handle linked guide language changes — ignore main guide (page handles it)
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Pill buttons */}
      <div className="grid w-full mb-4 gap-2 grid-cols-1">
        {/* Main guide pill */}
        <button
          className={cn(
            "flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all active:scale-[0.97]",
            isMainSelected
              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
              : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-sm"
          )}
          onClick={() => handlePillClick(mainGuide.id)}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Music className="w-4 h-4 shrink-0" />
            <span className="line-clamp-2 break-words text-left">{mainGuide.title}</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
        </button>

        {/* Linked guide pills */}
        {linkedGuides.map((guide) => {
          const isSelected = selectedGuideId === guide.guide_id && sheetOpen;
          return (
            <button
              key={guide.guide_id}
              onClick={() => handlePillClick(guide.guide_id)}
              className={cn(
                "flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all active:scale-[0.97]",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                  : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-sm"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 shrink-0" />
                <span className="line-clamp-2 break-words text-left">{guide.custom_title || guide.title}</span>
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
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
          <NewSectionAudioPlayer
            key={selectedGuideId}
            guideId={selectedGuideId}
            guideTitle={sheetTitle || ''}
            sections={sheetSections}
            mainAudioUrl={sheetAudioUrl}
            lang={languageByGuide[selectedGuideId] || languageCode}
          />
        )}
      </BottomSheet>
    </div>
  );
};