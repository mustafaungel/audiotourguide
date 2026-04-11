import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Music, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@/lib/translations';
import { AudioGuideLoader } from './AudioGuideLoader';
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
  const [activePlayingGuideId, setActivePlayingGuideId] = useState<string | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());

  // Sync parent on mount so activeGuideId matches the auto-expanded main guide
  useEffect(() => {
    onActiveTabChange?.('main');
  }, []);

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id, accessCode]);

  // Sync ALL guides to parent language when it changes (main + linked)
  useEffect(() => {
    setLanguageByGuide(prev => {
      const updated: Record<string, string> = { [mainGuide.id]: languageCode };
      // Sync linked guides to same language
      linkedGuides.forEach(g => { updated[g.guide_id] = languageCode; });
      return { ...prev, ...updated };
    });
  }, [languageCode, mainGuide.id, linkedGuides]);

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
        // Fallback RPC may not exist in all environments - handle gracefully
        let simple: any[] | null = null;
        try {
          const fallbackResult = await supabase
            .rpc('get_linked_guides_with_access', { p_guide_id: mainGuide.id, p_access_code: accessCode.trim() });
          if (!fallbackResult.error) simple = fallbackResult.data;
        } catch (_) { /* RPC may not exist */ }
        if (simple && simple.length > 0) {
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

  // Prefetch linked guide sections in background after they load
  useEffect(() => {
    if (linkedGuides.length > 0 && accessCode) {
      // Small delay to not compete with main content rendering
      const timer = setTimeout(() => {
        linkedGuides.forEach(g => ensureGuideSections(g.guide_id));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [linkedGuides, accessCode]);

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
    if (guideId !== mainGuide.id) {
      ensureGuideSections(guideId);
    }
    setSelectedGuideId(prev => prev === guideId ? null : guideId);
    onActiveTabChange?.(guideId === mainGuide.id ? 'main' : guideId);
  }, [mainGuide.id, ensureGuideSections, onActiveTabChange]);

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
        onPlayStart={() => setActivePlayingGuideId(mainGuide.id)}
        shouldStop={activePlayingGuideId !== null && activePlayingGuideId !== mainGuide.id}
      />
    );
  }

  const isMainExpanded = selectedGuideId === mainGuide.id;

  const renderGuideContent = (guideId: string, title: string, isExpanded: boolean, audioUrl?: string, imageUrl?: string) => {
    const sections = guideId === mainGuide.id ? mainSections : (sectionsByGuide[guideId] || []);
    return (
      <div
        className={cn(
          "grid transition-all duration-150 ease-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-2 mb-2"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <NewSectionAudioPlayer
            key={guideId}
            guideId={guideId}
            guideTitle={title}
            sections={sections}
            mainAudioUrl={audioUrl}
            guideImageUrl={imageUrl}
            onPlayStart={() => setActivePlayingGuideId(guideId)}
            shouldStop={activePlayingGuideId !== null && activePlayingGuideId !== guideId}
            lang={languageByGuide[guideId] || languageCode}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col w-full gap-2">
        {/* Main guide */}
        <div>
          <button
            className={cn(
            "flex items-center justify-between gap-2 w-full min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all duration-200",
              "active:scale-[0.95]",
              isMainExpanded
                ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-primary/30 active:bg-primary/80 active:shadow-inner"
                : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] active:bg-muted/80 active:shadow-inner"
            )}
            onClick={() => handlePillClick(mainGuide.id)}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Music className="w-4 h-4 shrink-0" />
              <span className="line-clamp-2 break-words text-left">{mainGuide.title}</span>
            </span>
            {isMainExpanded
              ? <ChevronUp className="w-4 h-4 shrink-0 opacity-70" />
              : <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
            }
          </button>
          {renderGuideContent(mainGuide.id, mainGuide.title, isMainExpanded, mainGuide.audio_url, guideImageUrl)}
        </div>

        {/* Linked guides */}
        {linkedGuides.map((guide) => {
          const isExpanded = selectedGuideId === guide.guide_id;
          return (
            <div key={guide.guide_id}>
              <button
                onClick={() => handlePillClick(guide.guide_id)}
                className={cn(
                  "flex items-center justify-between gap-2 w-full min-h-[48px] px-4 py-2.5 text-base font-medium rounded-xl transition-all duration-200",
                  "active:scale-[0.95]",
                  isExpanded
                    ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-primary/30 active:bg-primary/80 active:shadow-inner"
                    : "bg-muted/50 border border-border/50 hover:bg-muted hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] active:bg-muted/80 active:shadow-inner"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-2 break-words text-left">{guide.custom_title || guide.title}</span>
                </span>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 shrink-0 opacity-70" />
                  : <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                }
              </button>
              {renderGuideContent(
                guide.guide_id,
                guide.custom_title || guide.title,
                isExpanded,
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