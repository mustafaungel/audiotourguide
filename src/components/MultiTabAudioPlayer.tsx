import React, { useState, useEffect } from 'react';
import { NewSectionAudioPlayer } from './NewSectionAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './ui/badge';
import { Music } from 'lucide-react';
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

export const MultiTabAudioPlayer: React.FC<MultiTabAudioPlayerProps> = ({
  mainGuide,
  mainSections = [],
  accessCode,
  languageCode = 'en',
  onClose,
  onActiveTabChange
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionsByGuide, setSectionsByGuide] = useState<Record<string, Section[]>>({});
  const [languageByGuide, setLanguageByGuide] = useState<Record<string, string>>({
    [mainGuide.id]: languageCode
  });
  const [selectedLinkedGuide, setSelectedLinkedGuide] = useState<LinkedGuide | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadLinkedGuides();
  }, [mainGuide.id, accessCode]);

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

  // Listen for external events
  useEffect(() => {
    const handleOpenLinkedGuide = (event: CustomEvent) => {
      const { guideId } = (event as any).detail || {};
      if (guideId === 'main') {
        setSheetOpen(false);
        setSelectedLinkedGuide(null);
        return;
      }
      const guide = linkedGuides.find(g => g.guide_id === guideId);
      if (guide) {
        ensureGuideSections(guide.guide_id);
        setSelectedLinkedGuide(guide);
        setSheetOpen(true);
      }
      window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
    };

    const handleLanguageChange = async (e: CustomEvent) => {
      const { languageCode: newLang, guideId: targetId } = (e as any).detail || {};
      if (targetId && newLang) {
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
  }, [linkedGuides, accessCode]);

  const ensureGuideSections = async (guideId: string, overrideLanguage?: string) => {
    const effectiveLang = overrideLanguage || languageByGuide[guideId] || languageCode;

    if (!overrideLanguage && sectionsByGuide[guideId]?.length > 0) return;
    if (!accessCode) return;

    try {
      let sectionsData: any[] = [];
      let fetchSuccess = false;

      if (guideId === mainGuide.id) {
        const { data, error } = await supabase.rpc('get_sections_with_access', {
          p_guide_id: guideId, p_access_code: accessCode.trim(), p_language_code: effectiveLang
        });
        if (!error && data?.length > 0) { sectionsData = data; fetchSuccess = true; }
      } else {
        const { data, error } = await supabase.rpc('get_linked_guide_sections_with_access', {
          p_main_guide_id: mainGuide.id, p_access_code: accessCode.trim(),
          p_target_guide_id: guideId, p_language_code: effectiveLang
        });
        if (!error && data?.length > 0) { sectionsData = data; fetchSuccess = true; }
      }

      if (!fetchSuccess) {
        const { data, error } = await supabase.from('guide_sections')
          .select('*').eq('guide_id', guideId).eq('language_code', effectiveLang).order('order_index');
        if (!error && data?.length > 0) { sectionsData = data; }
      }

      setSectionsByGuide(prev => ({ ...prev, [guideId]: sectionsData }));
    } catch (error) {
      console.error('MultiTabAudioPlayer: Error loading sections:', error);
      setSectionsByGuide(prev => ({ ...prev, [guideId]: [] }));
    }
  };

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

  const handleLinkedGuideClick = (guide: LinkedGuide) => {
    ensureGuideSections(guide.guide_id);
    setSelectedLinkedGuide(guide);
    setSheetOpen(true);
    onActiveTabChange?.(guide.guide_id);
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedLinkedGuide(null);
      onActiveTabChange?.('main');
    }
  };

  if (loading) {
    return <AudioGuideLoader variant="inline" message={t('loading', languageCode)} />;
  }

  if (linkedGuides.length === 0) {
    return (
      <NewSectionAudioPlayer
        guideId={mainGuide.id} guideTitle={mainGuide.title}
        sections={mainSections} mainAudioUrl={mainGuide.audio_url}
        lang={languageByGuide[mainGuide.id] || languageCode}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Pill buttons */}
      <div className="grid w-full mb-4 gap-2 grid-cols-1">
        {/* Main guide pill - always active look */}
        <button
          className="flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 transition-all active:scale-[0.97]"
          onClick={() => { setSheetOpen(false); setSelectedLinkedGuide(null); }}
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
        </button>

        {/* Linked guide pills */}
        {linkedGuides.map((guide) => {
          const isSelected = selectedLinkedGuide?.guide_id === guide.guide_id && sheetOpen;
          const sectionCount = sectionsByGuide[guide.guide_id]?.length || 0;
          return (
            <button
              key={guide.guide_id}
              onClick={() => handleLinkedGuideClick(guide)}
              className={cn(
                "flex items-center justify-between gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl border border-transparent transition-all active:scale-[0.97]",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 shrink-0" />
                <span className="line-clamp-2 break-words text-left">{guide.custom_title || guide.title}</span>
              </span>
              {sectionCount > 0 && (
                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5 rounded-full tabular-nums">
                  {sectionCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Main guide always inline */}
      <NewSectionAudioPlayer
        guideId={mainGuide.id} guideTitle={mainGuide.title}
        sections={mainSections} mainAudioUrl={mainGuide.audio_url}
        lang={languageByGuide[mainGuide.id] || languageCode}
      />

      {/* Bottom sheet for linked guides */}
      <BottomSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        title={selectedLinkedGuide?.custom_title || selectedLinkedGuide?.title}
        defaultSnap="half"
        snapPoints={['half', 'full']}
      >
        {selectedLinkedGuide && (
          <NewSectionAudioPlayer
            guideId={selectedLinkedGuide.guide_id}
            guideTitle={selectedLinkedGuide.custom_title || selectedLinkedGuide.title}
            sections={sectionsByGuide[selectedLinkedGuide.guide_id] || []}
            mainAudioUrl=""
            lang={languageByGuide[selectedLinkedGuide.guide_id] || languageCode}
          />
        )}
      </BottomSheet>
    </div>
  );
};
