import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Music, ChevronRight } from 'lucide-react';
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
  const [masterAccessCode, setMasterAccessCode] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAvailableLanguages();
    loadLinkedGuides();
    fetchMasterAccessCode();
  }, [guideId]);

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
            .select('id, title, slug')
            .in('id', guideIds);

          const enrichedGuides = guides.map(g => ({
            ...g,
            title: guideDetails?.find(d => d.id === g.guide_id)?.title || g.custom_title,
            slug: guideDetails?.find(d => d.id === g.guide_id)?.slug
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

      {/* Enhanced Linked Guides Section */}
      {linkedGuides.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Additional Guides
            <Badge variant="outline" className="ml-auto text-xs">
              {linkedGuides.length} guide{linkedGuides.length > 1 ? 's' : ''}
            </Badge>
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linkedGuides.map((linkedGuide) => (
              <button
                key={linkedGuide.guide_id}
                onClick={() => {
                  console.log('AdditionalGuide click:', { guide_id: linkedGuide.guide_id, slug: linkedGuide.slug });
                  
                  // Add haptic feedback for mobile
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                  }
                  
                  // Try dispatching event first (for MultiTabAudioPlayer)
                  const event = new CustomEvent('openLinkedGuide', {
                    detail: { guideId: linkedGuide.guide_id, title: linkedGuide.custom_title }
                  });
                  
                  let eventHandled = false;
                  const handleEvent = () => {
                    eventHandled = true;
                    console.log('Handled by player');
                  };
                  
                  window.addEventListener('linkedGuideHandled', handleEvent, { once: true });
                  window.dispatchEvent(event);
                  
                  // Fallback navigation after a brief delay
                  setTimeout(() => {
                    if (!eventHandled && linkedGuide.slug) {
                      const accessParam = masterAccessCode ? `?access=${masterAccessCode}` : '';
                      const targetUrl = `/guide/${linkedGuide.slug}${accessParam}`;
                      
                      if (location.pathname.includes('/admin')) {
                        // Open in new tab when on admin page
                        window.open(targetUrl, '_blank');
                      } else {
                        // Navigate normally
                        navigate(targetUrl);
                      }
                    }
                  }, 100);
                }}
                className="
                  group relative flex items-center gap-3 p-4 
                  bg-gradient-to-r from-primary/5 to-primary/10 
                  hover:from-primary/10 hover:to-primary/20 
                  active:from-primary/20 active:to-primary/30
                  border border-primary/20 hover:border-primary/40
                  rounded-lg transition-all duration-200 
                  touch-manipulation min-h-[56px]
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                "
                aria-label={`Open ${linkedGuide.custom_title} guide`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {linkedGuide.custom_title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap to explore this guide
                  </p>
                </div>
                
                <div className="shrink-0 text-primary group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
                
                {/* Visual indicator overlay */}
                <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}