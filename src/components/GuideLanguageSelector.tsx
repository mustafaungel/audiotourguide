import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { getLanguageFlag, getLanguageDisplay } from '@/lib/language-utils';

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
  const [linkedGuides, setLinkedGuides] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableLanguages();
    loadLinkedGuides();
  }, [guideId]);

  const loadLinkedGuides = async () => {
    try {
      const { data: collection } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', guideId)
        .maybeSingle();

      if (collection?.linked_guides) {
        const guides = collection.linked_guides as any[];
        const guideIds = guides.map(g => g.guide_id);
        
        if (guideIds.length > 0) {
          const { data: guideDetails } = await supabase
            .from('audio_guides')
            .select('id, title')
            .in('id', guideIds);

          const enrichedGuides = guides.map(g => ({
            ...g,
            title: guideDetails?.find(d => d.id === g.guide_id)?.title || g.custom_title
          }));
          
          setLinkedGuides(enrichedGuides.sort((a, b) => a.order - b.order));
        }
      }
    } catch (error) {
      console.error('Error loading linked guides:', error);
    }
  };

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

  const selectedLanguageData = availableLanguages.find(lang => lang.language_code === selectedLanguage);
  const selectedDisplay = selectedLanguageData 
    ? getLanguageDisplay(selectedLanguageData.language_code, selectedLanguageData.native_name)
    : "Select language";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-auto min-w-[200px] sm:min-w-[250px] h-12 text-left">
            <SelectValue placeholder="Select language">
              {selectedLanguage && selectedDisplay}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[280px]">
            {availableLanguages.map((language) => (
              <SelectItem 
                key={language.language_code} 
                value={language.language_code}
                className="py-3 px-4"
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {getLanguageFlag(language.language_code)}
                    </span>
                    <span className="font-medium">
                      {language.native_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {language.section_count} sections
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Linked Guides */}
      {linkedGuides.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Additional Guides
          </label>
          <div className="flex flex-wrap gap-2">
            {linkedGuides.map((linkedGuide) => (
              <button
                key={linkedGuide.guide_id}
                onClick={() => {
                  // Trigger guide change by opening the multi-tab player
                  const event = new CustomEvent('openLinkedGuide', {
                    detail: { guideId: linkedGuide.guide_id, title: linkedGuide.custom_title }
                  });
                  window.dispatchEvent(event);
                }}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {linkedGuide.custom_title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}