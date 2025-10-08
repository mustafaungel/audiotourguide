import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Globe, Music, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { getLanguageFlag, getLanguageDisplay } from '@/lib/language-utils';
import { getBaseUrl } from '@/lib/url-utils';
import { BottomSheet, BottomSheetListItem } from '@/components/ui/bottom-sheet';
import { haptics } from '@/lib/haptics';

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
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

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
      
      // DO NOT auto-select language - let user choose
    } catch (error) {
      console.error('Error fetching available languages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only hide the language selector when there is 1 or fewer languages.
  // We still want to show Additional Guides even if language selection is not needed.

  const selectedLanguageData = availableLanguages.find(lang => lang.language_code === selectedLanguage);
  const selectedDisplay = selectedLanguageData 
    ? getLanguageDisplay(selectedLanguageData.language_code, selectedLanguageData.native_name)
    : "Select language";

  // Always allow language selection, even for single language guides
  const isMultiLanguage = true;

  return (
    <div className="space-y-3">
      {availableLanguages.length >= 1 && (
        <>
          {/* iOS-style Language Selector Button */}
          <button
            onClick={() => {
              haptics.light();
              setLanguageSheetOpen(true);
            }}
            className="ios-list-item w-full"
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {selectedDisplay}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Language Selection Bottom Sheet */}
          <BottomSheet
            open={languageSheetOpen}
            onOpenChange={setLanguageSheetOpen}
            title="Select Language"
          >
            <div className="space-y-1 pb-4">
              {availableLanguages.map((language) => {
                const isSelected = language.language_code === selectedLanguage;
                return (
                  <BottomSheetListItem
                    key={language.language_code}
                    selected={isSelected}
                    onSelect={() => {
                      haptics.selection();
                      
                      // Check if we're in MultiTabAudioPlayer context
                      const isInMultiTab = !!activeGuideId;
                      
                      if (isInMultiTab) {
                        // Multi-tab context: only dispatch event
                        const event = new CustomEvent('changeGuideLanguage', {
                          detail: { 
                            guideId: activeGuideId, 
                            languageCode: language.language_code
                          }
                        });
                        window.dispatchEvent(event);
                      } else {
                        // Single guide context: only call callback
                        onLanguageChange(language.language_code);
                      }
                      
                      setTimeout(() => setLanguageSheetOpen(false), 150);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {getLanguageFlag(language.language_code)}
                        </span>
                        <div className="text-left">
                          <div className="font-medium">
                            {language.native_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language.section_count} sections
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </BottomSheetListItem>
                );
              })}
            </div>
          </BottomSheet>
        </>
      )}

    </div>
  );
}