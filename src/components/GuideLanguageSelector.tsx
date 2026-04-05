import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchAvailableLanguages();
  }, [guideId, activeGuideId]);

  const fetchAvailableLanguages = async () => {
    setLoading(true);
    try {
      const targetGuideId = activeGuideId || guideId;
      const { data, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: targetGuideId });

      if (error) {
        console.error('Error fetching guide languages:', error);
        return;
      }

      setAvailableLanguages(data || []);
    } catch (error) {
      console.error('Error fetching available languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    haptics.selection();

    const isInMultiTab = !!activeGuideId;

    if (isInMultiTab) {
      const event = new CustomEvent('changeGuideLanguage', {
        detail: {
          guideId: activeGuideId,
          languageCode,
        }
      });
      window.dispatchEvent(event);
    } else {
      onLanguageChange(languageCode);
    }
  };

  if (loading || availableLanguages.length < 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">{t('language', selectedLanguage)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((language) => {
          const isSelected = language.language_code === selectedLanguage;
          return (
            <button
              key={language.language_code}
              onClick={() => handleLanguageSelect(language.language_code)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                "border",
                isSelected
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-card border-border text-foreground hover:bg-muted"
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {getLanguageFlag(language.language_code)}
              </span>
              <span>{language.native_name}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
