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
  const [linkedGuides, setLinkedGuides] = useState<any[]>([]);
  const [masterAccessCode, setMasterAccessCode] = useState<string>('');
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAvailableLanguages();
    loadLinkedGuides();
    fetchMasterAccessCode();
  }, [guideId, activeGuideId]);

  const fetchMasterAccessCode = async () => {
    try {
      const { data: guide } = await supabase
        .from('audio_guides')
        .select('master_access_code')
        .eq('id', guideId)
        .single();
      
      if (guide?.master_access_code) {
        setMasterAccessCode(guide.master_access_code);
      }
    } catch (error) {
      console.error('Error fetching master access code:', error);
    }
  };

  const loadLinkedGuides = async () => {
    try {
      console.log('GuideLanguageSelector: Loading linked guides for:', guideId);
      
      // Get access code from URL
      const params = new URLSearchParams(location.search);
      const accessCode = params.get('access_code') || params.get('access') || '';
      
      console.log('GuideLanguageSelector: Access code found:', !!accessCode);

      if (accessCode) {
        // Use the new comprehensive RPC that gets all data in one call
        const { data: fullLinkedGuides, error: rpcError } = await supabase
          .rpc('get_full_linked_guides_with_access', {
            p_guide_id: guideId,
            p_access_code: accessCode.trim(),
          });

        console.log('GuideLanguageSelector: RPC result:', { 
          error: rpcError, 
          count: fullLinkedGuides?.length || 0 
        });

        if (!rpcError && fullLinkedGuides && fullLinkedGuides.length > 0) {
          const enriched = fullLinkedGuides.map((g: any) => ({
            guide_id: g.guide_id,
            custom_title: g.custom_title,
            order: g.order_index,
            title: g.title,
            slug: g.slug,
            master_access_code: g.master_access_code,
          }));
          
          console.log('GuideLanguageSelector: Setting linked guides:', enriched.length);
          setLinkedGuides(enriched.sort((a: any, b: any) => a.order - b.order));
          return; // Successfully loaded via RPC
        }
      }

      console.log('GuideLanguageSelector: No access code or RPC failed, trying fallback');
      
      // Fallback to public tables for all users (works for published + approved guides)
      const { data: collection } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', guideId)
        .maybeSingle();

      console.log('GuideLanguageSelector: Collection query result:', { 
        found: !!collection, 
        hasLinkedGuides: !!collection?.linked_guides 
      });

      if (collection?.linked_guides) {
        const guides = collection.linked_guides as any[];
        const guideIds = guides.map(g => g.guide_id);
        
        console.log('GuideLanguageSelector: Found guide IDs:', guideIds);
        
        if (guideIds.length > 0) {
          // Only fetch published and approved guides for public access
          const { data: guideDetails } = await supabase
            .from('audio_guides')
            .select('id, title, slug, master_access_code, is_published, is_approved')
            .in('id', guideIds)
            .eq('is_published', true)
            .eq('is_approved', true);

          console.log('GuideLanguageSelector: Guide details fetched:', { 
            requested: guideIds.length, 
            found: guideDetails?.length || 0 
          });

          if (guideDetails && guideDetails.length > 0) {
            const enrichedGuides = guides
              .map(g => {
                const guideDetail = guideDetails.find(d => d.id === g.guide_id);
                if (!guideDetail) return null; // Skip unpublished/unapproved guides
                
                return {
                  ...g,
                  title: guideDetail.title || g.custom_title,
                  slug: guideDetail.slug,
                  master_access_code: guideDetail.master_access_code
                };
              })
              .filter(Boolean); // Remove null entries
            
            console.log('GuideLanguageSelector: Enriched guides ready:', enrichedGuides.length);
            setLinkedGuides(enrichedGuides.sort((a, b) => a.order - b.order));
          } else {
            console.log('GuideLanguageSelector: No published guides found');
            setLinkedGuides([]);
          }
        }
      } else {
        console.log('GuideLanguageSelector: No collection found');
        setLinkedGuides([]);
      }
    } catch (error) {
      console.error('GuideLanguageSelector: Error loading linked guides:', error);
      setLinkedGuides([]);
    }
  };

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

  const isMultiLanguage = availableLanguages.length > 1;

  return (
    <div className="space-y-3">
      {availableLanguages.length >= 1 && (
        <>
          {/* iOS-style Language Selector Button */}
          <button
            onClick={() => {
              if (isMultiLanguage) {
                haptics.light();
                setLanguageSheetOpen(true);
              }
            }}
            disabled={!isMultiLanguage}
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
              {isMultiLanguage && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
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
                      onLanguageChange(language.language_code);
                      
                      // Dispatch event for MultiTabAudioPlayer
                      const event = new CustomEvent('changeGuideLanguage', {
                        detail: { 
                          guideId: activeGuideId || guideId, 
                          languageCode: language.language_code
                        }
                      });
                      window.dispatchEvent(event);
                      
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

      {/* iOS-style Additional Guides Section - Collapsible on Mobile */}
      {linkedGuides.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => {
              const section = document.getElementById('additional-guides-content');
              if (section) {
                const isHidden = section.classList.contains('hidden');
                if (isHidden) {
                  section.classList.remove('hidden');
                } else {
                  section.classList.add('hidden');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 w-full hover:bg-muted/50 rounded-lg transition-colors md:cursor-default md:hover:bg-transparent"
          >
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Additional Guides
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {linkedGuides.length}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground md:hidden transition-transform" id="additional-guides-chevron" />
          </button>
          
          <div className="space-y-1 md:block" id="additional-guides-content">
            {linkedGuides.map((linkedGuide) => (
              <button
                key={linkedGuide.guide_id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('AdditionalGuide click:', { guide_id: linkedGuide.guide_id, slug: linkedGuide.slug });
                  
                  haptics.light();
                  
                  // Dispatch event for MultiTabAudioPlayer (no navigation)
                  const event = new CustomEvent('openLinkedGuide', {
                    detail: { guideId: linkedGuide.guide_id, title: linkedGuide.custom_title }
                  });
                  window.dispatchEvent(event);
                  
                  // Signal that event was dispatched
                  window.dispatchEvent(new CustomEvent('linkedGuideHandled'));
                }}
                className="ios-list-item w-full group hover:bg-muted/70 active:bg-muted"
                aria-label={`Open ${linkedGuide.custom_title} guide`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="ios-body font-semibold truncate">
                      {linkedGuide.custom_title}
                    </h4>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}