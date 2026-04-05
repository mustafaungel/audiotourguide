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

  useEffect(() => {
    fetchAvailableLanguages();
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
    const isInMultiTab = !!activeGuideId;
    if (isInMultiTab) {
      window.dispatchEvent(new CustomEvent('changeGuideLanguage', {
        detail: { guideId: activeGuideId, languageCode }
      }));
    } else {
      onLanguageChange(languageCode);
    }
    setCollapsed(true);
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
    <div className={cn("space-y-2 transition-opacity duration-200", fetching && "opacity-70 pointer-events-none")}>
      {/* Header with selected language badge */}
      <div className="flex items-center gap-2 px-1">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">{t('language', selectedLanguage)}</span>
        {collapsed && selectedLangInfo && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <span>{getLanguageFlag(selectedLanguage)}</span>
            <span>{selectedLangInfo.native_name}</span>
          </span>
        )}
      </div>
      {(() => {
        const selectedIndex = displayLanguages.findIndex(l => l.language_code === selectedLanguage);
        const rowHeight = 52;
        const gap = 8;
        const totalRows = Math.ceil(displayLanguages.length / 2);
        const maxH = collapsed
          ? rowHeight
          : totalRows * rowHeight + (totalRows - 1) * gap;
        const selectedCol = collapsed ? (Math.max(selectedIndex, 0) % 2) + 1 : undefined;

        return (
          <div
            className="grid grid-cols-2 gap-2 overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: `${maxH}px` }}
          >
            {displayLanguages.map((language) => {
              const isSelected = language.language_code === selectedLanguage;
              const isHidden = collapsed && !isSelected;
              return (
                <button
                  key={language.language_code}
                  onClick={() => handleLanguageSelect(language.language_code)}
                  style={isSelected && collapsed ? { gridColumn: selectedCol } : undefined}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-3 rounded-xl text-sm font-medium",
                    "border active:scale-[0.97]",
                    "transition-all duration-300 ease-in-out",
                    isSelected
                      ? "bg-primary/15 border-primary text-primary shadow-md ring-2 ring-primary/30 min-h-[44px] opacity-100 scale-100"
                      : "bg-card border-border text-foreground hover:bg-muted min-h-[44px] opacity-100 scale-100",
                    isHidden && "opacity-0 scale-90 max-h-0 min-h-0 py-0 my-0 border-0 overflow-hidden pointer-events-none"
                  )}
                >
                  <span className="text-lg" aria-hidden="true">
                    {getLanguageFlag(language.language_code)}
                  </span>
                  <span>{language.native_name}</span>
                  {isSelected && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
