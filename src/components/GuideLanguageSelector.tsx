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
    if (languageCode === selectedLanguage) return;
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
    <div className={cn("space-y-3 transition-opacity duration-200", fetching && "opacity-70 pointer-events-none")}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">{t('language', selectedLanguage)}</span>
      </div>

      {/* Circular flag buttons */}
      <div className="flex flex-wrap items-end justify-center gap-3">
        {displayLanguages.map((language) => {
          const isSelected = language.language_code === selectedLanguage;
          return (
            <button
              key={language.language_code}
              onClick={() => handleLanguageSelect(language.language_code)}
              className="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90"
            >
              <div className={cn(
                "rounded-full flex items-center justify-center transition-all duration-300",
                isSelected
                  ? "w-14 h-14 ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20"
                  : "w-10 h-10 border-2 border-border/50 hover:border-primary/50 hover:scale-110"
              )}>
                <span className={cn("select-none", isSelected ? "text-3xl" : "text-xl")}>
                  {getLanguageFlag(language.language_code)}
                </span>
              </div>
              {isSelected && (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <span className="text-xs font-semibold text-primary">{language.native_name}</span>
                  <Check className="h-3 w-3 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
