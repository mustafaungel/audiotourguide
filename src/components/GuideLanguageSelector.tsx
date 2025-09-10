import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface GuideLanguageSelectorProps {
  guideId: string;
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

interface GuideLanguage {
  language_code: string;
  language_name: string;
  native_name: string;
  section_count: number;
}

export function GuideLanguageSelector({ guideId, selectedLanguage, onLanguageChange }: GuideLanguageSelectorProps) {
  const [availableLanguages, setAvailableLanguages] = useState<GuideLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableLanguages();
  }, [guideId]);

  const fetchAvailableLanguages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_guide_languages', { p_guide_id: guideId });

      if (error) {
        console.error('Error fetching guide languages:', error);
        return;
      }

      setAvailableLanguages(data || []);
      
      // Set default language if none selected
      if (!selectedLanguage && data && data.length > 0) {
        // Try to find English first, otherwise use the first available
        const defaultLang = data.find(lang => lang.language_code === 'en') || data[0];
        onLanguageChange(defaultLang.language_code);
      }
    } catch (error) {
      console.error('Error fetching available languages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show selector if only one language is available
  if (loading || availableLanguages.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-auto min-w-[150px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((language) => (
            <SelectItem key={language.language_code} value={language.language_code}>
              <div className="flex items-center gap-2">
                <span>{language.native_name}</span>
                <span className="text-xs text-muted-foreground">
                  ({language.section_count} sections)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}