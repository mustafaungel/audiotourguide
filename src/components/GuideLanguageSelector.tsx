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
  // Keep last known languages to prevent layout jump during refetch
  const lastLanguagesRef = useRef<GuideLanguage[]>([]);

  useEffect(() => {
    fetchAvailableLanguages();
  }, [guideId, activeGuideId]);

  const fetchAvailableLanguages = async () => {
    // If we already have languages, show them while refetching (stale-while-revalidate)
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
  const filteredLanguages = collapsed
    ? displayLanguages.filter(l => l.language_code === selectedLanguage)
    : displayLanguages;

  if (loading && displayLanguages.length === 0) {
    // First load: stable placeholder
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

  // No languages at all — return stable-height empty placeholder instead of null
  if (displayLanguages.length < 1) {
    return <div className="min-h-[48px]" />;
  }

  return (
    <div className={cn("space-y-2 transition-opacity duration-200", fetching && "opacity-70 pointer-events-none")}>
      <div className="flex items-center gap-2 px-1">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">{t('language', selectedLanguage)}</span>
      </div>
      <div className={cn(
        "grid gap-2 transition-all duration-200 overflow-hidden",
        filteredLanguages.length === 2 ? "grid-cols-2" : filteredLanguages.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredLanguages.map((language) => {
          const isSelected = language.language_code === selectedLanguage;
          return (
            <button
              key={language.language_code}
              onClick={() => handleLanguageSelect(language.language_code)}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200",
                "border active:scale-[0.97]",
                isSelected
                  ? "bg-primary/10 border-primary text-primary shadow-sm ring-2 ring-primary/20"
                  : "bg-card border-border text-foreground hover:bg-muted"
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {getLanguageFlag(language.language_code)}
              </span>
              <span>{language.native_name}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
