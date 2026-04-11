import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Check } from 'lucide-react';
import { getLanguageFlag, getLanguageDisplay } from '@/lib/language-utils';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';

interface GuideLanguageSelectorProps {
  guideId: string;
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  activeGuideId?: string;
}

interface GuideLanguage {
  language_code: string;
  language_name: string;
  native_name: string;
  section_count: number;
}

export function GuideLanguageSelector({ guideId, selectedLanguage, onLanguageChange, activeGuideId }: GuideLanguageSelectorProps) {
  const [availableLanguages, setAvailableLanguages] = useState<GuideLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastLanguagesRef = useRef<GuideLanguage[]>([]);
  const lastFetchedGuideRef = useRef<string>('');

  useEffect(() => {
    const targetId = activeGuideId || guideId;
    // Only re-fetch when the actual target guide changes
    if (targetId !== lastFetchedGuideRef.current) {
      lastFetchedGuideRef.current = targetId;
      fetchAvailableLanguages();
    }
  }, [guideId, activeGuideId]);

  const fetchAvailableLanguages = async () => {
    if (lastLanguagesRef.current.length > 0) {
      setFetching(true);
    } else {
      setLoading(true);
    }
    
    try {
      const targetGuideId = activeGuideId || guideId;
      const { data, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: targetGuideId });

      if (error) {
        console.error('Error fetching guide languages:', error);
        return;
      }

      const languages = data || [];
      setAvailableLanguages(languages);
      if (languages.length > 0) {
        lastLanguagesRef.current = languages;
      }
    } catch (error) {
      console.error('Error fetching available languages:', error);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    haptics.selection();
    if (languageCode === selectedLanguage && collapsed) {
      setCollapsed(false);
      return;
    }
    setCollapsed(true);
    requestAnimationFrame(() => {
      const isInMultiTab = !!activeGuideId;
      const isLinkedGuide = isInMultiTab && activeGuideId !== guideId;
      if (isLinkedGuide) {
        window.dispatchEvent(new CustomEvent('changeGuideLanguage', {
          detail: { guideId: activeGuideId, languageCode }
        }));
      } else {
        onLanguageChange(languageCode);
      }
    });
  };

  const displayLanguages = availableLanguages.length > 0 ? availableLanguages : lastLanguagesRef.current;

  // Find selected language info for the header badge
  const selectedLangInfo = displayLanguages.find(l => l.language_code === selectedLanguage);

  if (loading && displayLanguages.length === 0) {
    return (
      <div className="space-y-2 min-h-[48px]">
        <div className="flex items-center gap-2 px-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">{t('language', selectedLanguage)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-11 w-24 rounded-xl bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (displayLanguages.length < 1) {
    return <div className="min-h-[48px]" />;
  }

  return (
    <div className={cn("space-y-1.5 transition-opacity duration-200", fetching && "opacity-70 pointer-events-none")}>
      {/* Selected language label */}
      <div className="flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{t('language', selectedLanguage)}:</span>
        {selectedLangInfo && (
          <span className="text-xs font-semibold text-primary">
            {getLanguageFlag(selectedLanguage)} {selectedLangInfo.native_name}
          </span>
        )}
      </div>

      {/* Horizontal scrollable flag row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {displayLanguages.map((language) => {
          const isSelected = language.language_code === selectedLanguage;
          return (
            <button
              key={language.language_code}
              onClick={() => handleLanguageSelect(language.language_code)}
              className={cn(
                "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200 active:scale-90",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                  : "border border-border/50 hover:border-primary/50 hover:scale-110"
              )}
              title={language.native_name}
            >
              {getLanguageFlag(language.language_code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
