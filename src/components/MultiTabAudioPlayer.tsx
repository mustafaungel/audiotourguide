import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Music, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@/lib/translations';
import { AudioGuideLoader } from './AudioGuideLoader';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

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
  image_url?: string;
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
  guideImageUrl?: string;
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
  guideImageUrl,
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
  const [closingGuideId, setClosingGuideId] = useState<string | null>(null);
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

    const fetchSectionsForLang = async (gId: string, lang: string): Promise<any[]> => {
      if (gId === mainGuide.id) {
        const { data, error } = await supabase.rpc('get_sections_with_access', {
          p_guide_id: gId, p_access_code: accessCode!.trim(), p_language_code: lang
        });
        if (!error && data?.length > 0) return data;
      } else {
        const { data, error } = await supabase.rpc('get_linked_guide_sections_with_access', {
          p_main_guide_id: mainGuide.id, p_access_code: accessCode!.trim(),
          p_target_guide_id: gId, p_language_code: lang
        });
        if (!error && data?.length > 0) return data;
      }
      // Direct table fallback
      const { data, error } = await supabase.from('guide_sections')
        .select('*').eq('guide_id', gId).eq('language_code', lang).order('order_index');
      if (!error && data?.length > 0) return data;
      return [];
    };

    try {
      let sectionsData = await fetchSectionsForLang(guideId, effectiveLang);
      let usedLang = effectiveLang;

      // Language fallback: try English first, then any available language
      if (sectionsData.length === 0 && effectiveLang !== 'en') {
        sectionsData = await fetchSectionsForLang(guideId, 'en');
        if (sectionsData.length > 0) usedLang = 'en';
      }

      if (sectionsData.length === 0 && effectiveLang !== 'en') {
        const { data: availableLangs } = await supabase.from('guide_sections')
          .select('language_code').eq('guide_id', guideId).limit(1);
        if (availableLangs?.[0]?.language_code) {
          const fallbackLang = availableLangs[0].language_code;
          sectionsData = await fetchSectionsForLang(guideId, fallbackLang);
          if (sectionsData.length > 0) usedLang = fallbackLang;
        }
      }

      // Update language state if we fell back
      if (usedLang !== effectiveLang) {
        setLanguageByGuide(prev => ({ ...prev, [guideId]: usedLang }));
      }

      const finalCacheKey = `${guideId}_${usedLang}`;
      sectionCache.set(finalCacheKey, sectionsData);
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
        const guideIds = fullLinkedGuides.map((g: any) => g.guide_id);
        const { data: guideImages } = await supabase
          .from('audio_guides').select('id, image_url').in('id', guideIds);
        const imageMap = new Map((guideImages || []).map((g: any) => [g.id, g.image_url]));

        const processed: LinkedGuide[] = fullLinkedGuides.map((g: any) => ({
          guide_id: g.guide_id, custom_title: g.custom_title, order_index: g.order_index || 0,
          title: g.title, slug: g.slug, master_access_code: g.master_access_code,
          image_url: imageMap.get(g.guide_id) || undefined, sections: []
        }));
        setLinkedGuides(processed.sort((a, b) => a.order_index - b.order_index));
      } else {
        const { data: simple, error: fallbackError } = await supabase
          .rpc('get_linked_guides_with_access', { p_guide_id: mainGuide.id, p_access_code: accessCode.trim() });
        if (!fallbackError && simple?.length > 0) {
          const guideIds = simple.map((g: any) => g.guide_id);
          const { data: guideImages } = await supabase
            .from('audio_guides').select('id, image_url').in('id', guideIds);
          const imageMap = new Map((guideImages || []).map((g: any) => [g.id, g.image_url]));

          const processed: LinkedGuide[] = simple.map((g: any) => ({
            guide_id: g.guide_id, custom_title: g.custom_title, order_index: g.order_index || 0,
            title: g.title, slug: g.slug, master_access_code: g.master_access_code,
            image_url: imageMap.get(g.guide_id) || undefined, sections: []
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
        setSelectedGuideId(prev => prev === mainGuide.id ? null : mainGuide.id);
        return;
      }
      const guide = linkedGuides.find(g => g.guide_id === guideId);
      if (guide) {
        ensureGuideSections(guide.guide_id);
        setSelectedGuideId(prev => prev === guide.guide_id ? null : guide.guide_id);
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
    haptics.light();
    if (guideId !== mainGuide.id) {
      ensureGuideSections(guideId);
    }
    if (selectedGuideId === guideId) {
      // Start closing animation
      setClosingGuideId(guideId);
      setSelectedGuideId(null);
    } else {
      // Close previous with animation if any
      if (selectedGuideId) {
        setClosingGuideId(selectedGuideId);
      }
      setSelectedGuideId(guideId);
    }
    onActiveTabChange?.(guideId === mainGuide.id ? 'main' : guideId);
  }, [mainGuide.id, ensureGuideSections, onActiveTabChange, selectedGuideId]);

  if (loading && mainSections.length === 0) {
    return <AudioGuideLoader variant="inline" message={t('loading', languageCode)} />;
  }

  if (linkedGuides.length === 0) {
    return (
      <NewSectionAudioPlayer
        key={mainGuide.id}
        guideId={mainGuide.id} guideTitle={mainGuide.title}
        sections={mainSections} mainAudioUrl={mainGuide.audio_url}
        guideImageUrl={guideImageUrl}
        lang={languageByGuide[mainGuide.id] || languageCode}
      />
    );
  }

  const isMainExpanded = selectedGuideId === mainGuide.id;

  const renderGuideContent = (guideId: string, title: string, isClosing: boolean, audioUrl?: string, imageUrl?: string) => {
    const sections = guideId === mainGuide.id ? mainSections : (sectionsByGuide[guideId] || []);
    return (
      <div
        className={cn(
          "mt-2 mb-2 overflow-hidden",
          isClosing ? "animate-accordion-up" : "animate-accordion-down"
        )}
        onAnimationEnd={() => {
          if (isClosing) setClosingGuideId(null);
        }}
      >
        <NewSectionAudioPlayer
          key={guideId}
          guideId={guideId}
          guideTitle={title}
          sections={sections}
          mainAudioUrl={audioUrl}
          guideImageUrl={imageUrl}
          lang={languageByGuide[guideId] || languageCode}
        />
      </div>
    );
  };

  const shouldShowContent = (guideId: string) => selectedGuideId === guideId || closingGuideId === guideId;
  const isClosingContent = (guideId: string) => closingGuideId === guideId && selectedGuideId !== guideId;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col w-full gap-2">
        {/* Main guide */}
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 w-full min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all active:scale-[0.97]",
              isMainExpanded
                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-sm"
            )}
            onClick={() => handlePillClick(mainGuide.id)}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Music className="w-4 h-4 shrink-0" />
              <span className="line-clamp-2 break-words text-left">{mainGuide.title}</span>
            </span>
            {isMainExpanded
              ? <ChevronUp className="w-4 h-4 shrink-0 opacity-50" />
              : <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
            }
          </button>
          {shouldShowContent(mainGuide.id) && renderGuideContent(mainGuide.id, mainGuide.title, isClosingContent(mainGuide.id), mainGuide.audio_url, guideImageUrl)}
        </div>

        {/* Linked guides */}
        {linkedGuides.map((guide) => {
          const isExpanded = selectedGuideId === guide.guide_id;
          return (
            <div key={guide.guide_id}>
              <button
                onClick={() => handlePillClick(guide.guide_id)}
                className={cn(
                  "flex items-center justify-between gap-2 w-full min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all active:scale-[0.97]",
                  isExpanded
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                    : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-sm"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-2 break-words text-left">{guide.custom_title || guide.title}</span>
                </span>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 shrink-0 opacity-50" />
                  : <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                }
              </button>
              {shouldShowContent(guide.guide_id) && renderGuideContent(
                guide.guide_id,
                guide.custom_title || guide.title,
                isClosingContent(guide.guide_id),
                undefined,
                guide.image_url || guideImageUrl
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};