import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Check, ChevronDown, Headphones } from 'lucide-react';
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
    <div className={cn("space-y-2 transition-opacity duration-200", fetching && "opacity-70 pointer-events-none")}>
      {/* Language buttons — collapsed shows only selected, expanded shows all */}
      <div className={cn(
        "grid gap-2 transition-all duration-300",
        collapsed ? "grid-cols-1" : "grid-cols-2"
      )}>
        {displayLanguages.map((language) => {
          const isSelected = language.language_code === selectedLanguage;
          if (collapsed && !isSelected) return null;
          return (
            <button
              key={language.language_code}
              onClick={() => handleLanguageSelect(language.language_code)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium",
                "border active:scale-[0.97] transition-all duration-200",
                isSelected
                  ? "bg-primary/15 border-primary text-primary ring-1 ring-primary/30"
                  : "bg-card border-border text-foreground hover:bg-muted",
                isSelected && collapsed && "col-span-full"
              )}
            >
              <Headphones className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/50")} />
              <span className="text-lg shrink-0">{getLanguageFlag(language.language_code)}</span>
              <span className="truncate">{language.native_name}</span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
              )}
              {isSelected && collapsed && displayLanguages.length > 1 && (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {collapsed && displayLanguages.length > 1 && (
        <p className="text-[10px] text-muted-foreground/60 text-center">tap to change language</p>
      )}
    </div>
  );
}
