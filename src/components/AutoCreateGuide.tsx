import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mergeAudioFiles } from '@/utils/audioMerge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, MapPin, Landmark, Languages, DollarSign, Mic, Loader2, CheckCircle, Music, Image, Copy, ChevronDown, Play, Pause, Wind, Sparkles, Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import { ALL_COUNTRIES, ELEVENLABS_LANGUAGES, GUIDE_CATEGORIES } from '@/data/countries-full';
import { toast } from 'sonner';
import { StepIndicator } from '@/components/ui/step-indicator';
import { LanguagePicker } from '@/components/ui/language-picker';
import {
  BALLOON_DEFAULT_DURATION,
  BALLOON_DEFAULT_THEME,
  BALLOON_VALLEYS,
  DIRECTIONAL_WARNING_PATTERN,
  buildBalloonMasterTitle,
  combineBalloonScripts,
  detectCoveredValleys,
  detectUnexpectedValleys,
  formatValleyName,
} from '@/lib/balloon-guide';

interface SuggestedCity {
  name: string;
  description: string;
  kind?: string;
}

interface SuggestedAttraction {
  name: string;
  type: string;
  description: string;
  suggested_category: string;
  significance: string;
  group?: string;
}

interface PlannedSection {
  title: string;
  subtitle: string;
  key_topics: string[];
  estimated_minutes: number;
  mood: string;
  transition_hint: string;
  fun_fact: string;
}

type Step = 'form' | 'plan_review' | 'generating_scripts' | 'script_review' | 'audio_upload' | 'creating_image' | 'done_review' | 'published' | 'error';
type GuideType = 'standard' | 'balloon';

interface CreationProgress {
  step: number;
  totalSteps: number;
  message: string;
  detail?: string;
}

const groupAttractions = (items: SuggestedAttraction[]) => {
  return items.reduce<Record<string, SuggestedAttraction[]>>((acc, item) => {
    const key = item.group || item.suggested_category || 'More ideas';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

export function AutoCreateGuide() {
  // Form wizard sub-step (only used when currentStep === 'form')
  // 0 = Guide Type, 1 = Location, 2 = Settings
  const [formStep, setFormStep] = useState<number>(0);
  const [guideType, setGuideType] = useState<GuideType>('standard');

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [place, setPlace] = useState('');
  const [placeInput, setPlaceInput] = useState('');
  const [category, setCategory] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [priceUsd, setPriceUsd] = useState('499');

  const [coveredValleys, setCoveredValleys] = useState<string[]>(['Goreme Valley']);

  const [cities, setCities] = useState<SuggestedCity[]>([]);
  const [attractions, setAttractions] = useState<SuggestedAttraction[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAttractions, setLoadingAttractions] = useState(false);

  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [progress, setProgress] = useState<CreationProgress>({ step: 0, totalSteps: 1, message: '' });
  const [result, setResult] = useState<{ shareUrl: string; accessCode: string; guideId: string } | null>(null);
  const [creationError, setCreationError] = useState<{ message: string; step: string } | null>(null);

  const [plannedSections, setPlannedSections] = useState<PlannedSection[]>([]);
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [regeneratingScript, setRegeneratingScript] = useState<number | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<{ audio_url: string; duration_seconds: number }[]>([]);

  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [playingUploadAudio, setPlayingUploadAudio] = useState<number | null>(null);
  const uploadAudioRef = useRef<HTMLAudioElement | null>(null);

  const finalCity = city || cityInput;
  const finalPlace = place || placeInput;
  const isBalloonMode = guideType === 'balloon';
  const groupedAttractions = groupAttractions(attractions);
  const balloonMasterTitle = isBalloonMode ? buildBalloonMasterTitle(coveredValleys, finalCity || finalPlace || 'Cappadocia') : '';
  const combinedBalloonScript = isBalloonMode ? combineBalloonScripts(generatedScripts) : '';
  const combinedBalloonWordCount = combinedBalloonScript.trim().split(/\s+/).filter(Boolean).length;
  const combinedBalloonMinutes = Math.round(combinedBalloonWordCount / 150);
  const scriptWarnings = generatedScripts
    .map((script, index) => ({ index, flagged: DIRECTIONAL_WARNING_PATTERN.test(script) }))
    .filter((item) => item.flagged)
    .map((item) => item.index);
  const balloonCoverage = isBalloonMode ? detectCoveredValleys(combinedBalloonScript, coveredValleys) : [];
  const unexpectedBalloonValleys = isBalloonMode ? detectUnexpectedValleys(combinedBalloonScript, coveredValleys) : [];

  const primaryLangCode = selectedLanguages[0] || 'en';
  const primaryLangName = ELEVENLABS_LANGUAGES.find((l) => l.code === primaryLangCode)?.name || 'English';

  const resetLocationState = () => {
    setCity('');
    setCityInput('');
    setPlace('');
    setPlaceInput('');
    setAttractions([]);
    setCities([]);
  };

  const handleGuideTypeChange = (value: GuideType) => {
    setGuideType(value);
    resetLocationState();
    if (value === 'balloon') {
      setCategory('Local Experience');
      setCoveredValleys(['Goreme Valley']);
    }
  };

  const handleCountryChange = useCallback(async (countryName: string) => {
    setCountry(countryName);
    resetLocationState();

    if (!countryName) return;
    setLoadingCities(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-cities', {
        body: { country: countryName, mode: guideType },
      });
      if (!error && data?.cities) {
        setCities(data.cities);
      }
    } catch {
    } finally {
      setLoadingCities(false);
    }
  }, [guideType]);

  const handleCitySelect = useCallback(async (cityName: string) => {
    setCity(cityName);
    setCityInput(cityName);
    setPlace('');
    setPlaceInput('');
    setAttractions([]);

    if (!cityName || !country) return;
    setLoadingAttractions(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-attractions', {
        body: { country, city: cityName, mode: guideType },
      });
      if (!error && data?.attractions) {
        setAttractions(data.attractions);
      }
    } catch {
    } finally {
      setLoadingAttractions(false);
    }
  }, [country, guideType]);

  const handleAttractionSelect = useCallback((attraction: SuggestedAttraction) => {
    setPlace(attraction.name);
    setPlaceInput(attraction.name);
    if (attraction.suggested_category) {
      setCategory(attraction.suggested_category);
    }
  }, []);

  const toggleLanguage = useCallback((langCode: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(langCode)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== langCode);
      }
      return [...prev, langCode];
    });
  }, []);

  const toggleValley = (valley: string) => {
    setCoveredValleys((prev) => {
      if (prev.includes(valley)) {
        return prev.length === 1 ? prev : prev.filter((item) => item !== valley);
      }
      return [...prev, valley];
    });
  };

  const isFormValid = Boolean(
    country &&
    finalCity &&
    finalPlace &&
    selectedLanguages.length > 0 &&
    (!isBalloonMode || coveredValleys.length > 0)
  );

  const buildSharedPayload = () => ({
    mode: guideType,
    country,
    city: finalCity,
    place: finalPlace,
    place_type: isBalloonMode ? 'balloon_flight_experience' : '',
    category: category || (isBalloonMode ? 'Local Experience' : 'Historical'),
    covered_valleys: isBalloonMode ? coveredValleys : [],
    flight_theme: isBalloonMode ? BALLOON_DEFAULT_THEME : null,
    estimated_listening_minutes: isBalloonMode ? BALLOON_DEFAULT_DURATION : null,
    include_intro_outro_notes: isBalloonMode,
  });

  const handlePlanSections = async () => {
    if (!isFormValid) return;

    setCurrentStep('generating_scripts');
    setProgress({ step: 1, totalSteps: 1, message: isBalloonMode ? 'Designing a balloon narration flow...' : 'Researching location and planning sections...' });

    try {
      const { data: planData, error: planError } = await supabase.functions.invoke('plan-guide-sections', {
        body: buildSharedPayload(),
      });
      if (planError || !planData?.sections) throw new Error('Failed to plan sections');
      setPlannedSections(planData.sections);
      setCurrentStep('plan_review');
    } catch (error: any) {
      console.error('Planning failed:', error);
      setCreationError({ message: error.message, step: 'planning' });
      setCurrentStep('error');
    }
  };

  const handleGenerateScripts = async () => {
    if (!isFormValid) return;

    setCurrentStep('generating_scripts');
    const sections = plannedSections;

    try {
      const scripts: string[] = [];
      const scriptStartTime = Date.now();
      for (let i = 0; i < sections.length; i++) {
        const elapsed = Math.floor((Date.now() - scriptStartTime) / 1000);
        const perSection = i > 0 ? elapsed / i : 20;
        const remaining = Math.ceil((sections.length - i) * perSection);
        setProgress({
          step: i + 1,
          totalSteps: sections.length,
          message: isBalloonMode ? 'Writing long-form balloon narration...' : 'Writing narration scripts...',
          detail: `Section ${i + 1}/${sections.length} · ~${remaining}s remaining`,
        });

        const prevScript = i > 0 ? scripts[i - 1] : null;
        const previousEnding = prevScript ? prevScript.slice(-500) : null;
        const previousOpening = prevScript ? prevScript.split('.')[0] + '.' : null;
        const allPreviousOpenings = scripts.map((s, idx) => `Section ${idx + 1}: "${s.split('.')[0]}."`).join('\n');

        const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-section-script', {
          body: {
            ...buildSharedPayload(),
            section: sections[i],
            previous_ending: previousEnding,
            previous_opening: previousOpening,
            previous_openings_list: allPreviousOpenings || null,
            next_title: i < sections.length - 1 ? sections[i + 1].title : null,
            language: primaryLangName,
          },
        });
        if (scriptError || !scriptData?.script) throw new Error(`Failed to generate script for section ${i + 1}`);
        scripts.push(scriptData.script);
      }
      setGeneratedScripts(scripts);
      setCurrentStep('script_review');
    } catch (error: any) {
      console.error('Script generation failed:', error);
      setCreationError({ message: error.message, step: 'scripts' });
      setCurrentStep('error');
    }
  };

  const handleRegenerateScript = async (index: number) => {
    const sections = plannedSections;
    setRegeneratingScript(index);
    try {
      const prevScript = index > 0 ? generatedScripts[index - 1] : null;
      const allPreviousOpenings = generatedScripts.slice(0, index).map((s, idx) => `Section ${idx + 1}: "${s.split('.')[0]}."`).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-section-script', {
        body: {
          ...buildSharedPayload(),
          section: sections[index],
          previous_ending: prevScript ? prevScript.slice(-500) : null,
          previous_opening: prevScript ? prevScript.split('.')[0] + '.' : null,
          previous_openings_list: allPreviousOpenings || null,
          next_title: index < sections.length - 1 ? sections[index + 1].title : null,
          language: primaryLangName,
        },
      });
      if (error || !data?.script) throw new Error('Regeneration failed');
      setGeneratedScripts((prev) => prev.map((s, i) => i === index ? data.script : s));
      toast.success(`Section ${index + 1} script regenerated`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRegeneratingScript(null);
    }
  };

  const handleCopyScript = async (index: number) => {
    try {
      await navigator.clipboard.writeText(generatedScripts[index]);
      setCopiedScript(index);
      toast.success('Script copied! Paste it in ElevenLabs');
      setTimeout(() => setCopiedScript(null), 3000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleAudioUpload = async (index: number, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploadingSection(index);
    try {
      const { blob, duration } = await mergeAudioFiles(fileArray);
      const path = `uploaded-${Date.now()}-${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage.from('guide-audio').upload(path, blob, { contentType: 'audio/mpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('guide-audio').getPublicUrl(path);
      setGeneratedAudio((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push({ audio_url: '', duration_seconds: 0 });
        next[index] = { audio_url: urlData.publicUrl, duration_seconds: duration };
        return next;
      });
      toast.success(fileArray.length > 1 ? `${fileArray.length} files merged & uploaded for section ${index + 1}` : `Audio uploaded for section ${index + 1}`);
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    }
    setUploadingSection(null);
  };

  const handleRemoveAudio = (index: number) => {
    if (uploadAudioRef.current) {
      uploadAudioRef.current.pause();
      uploadAudioRef.current = null;
    }
    setPlayingUploadAudio(null);
    setGeneratedAudio((prev) => prev.map((a, i) => i === index ? { audio_url: '', duration_seconds: 0 } : a));
  };

  const playUploadedAudio = (index: number) => {
    if (uploadAudioRef.current) {
      uploadAudioRef.current.pause();
      uploadAudioRef.current = null;
    }
    if (playingUploadAudio === index) {
      setPlayingUploadAudio(null);
      return;
    }
    const url = generatedAudio[index]?.audio_url;
    if (!url) return;
    const audio = new Audio(url);
    audio.onended = () => {
      setPlayingUploadAudio(null);
      uploadAudioRef.current = null;
    };
    audio.play();
    setPlayingUploadAudio(index);
    uploadAudioRef.current = audio;
  };

  const handleFinalize = async () => {
    if (!isFormValid) return;

    setCurrentStep('creating_image');
    const sections = plannedSections;
    const scripts = generatedScripts;

    try {
      setProgress({ step: 1, totalSteps: 2, message: 'Generating cover image...' });
      const imagePrompt = isBalloonMode
        ? `Editorial travel photography of hot air balloons over ${finalPlace} in ${finalCity}, ${country}. Wide premium landscape, dawn atmosphere, layered valleys, volcanic rock formations, refined natural color grading, no cockpit view, no text, no watermark, no people in close-up, premium travel magazine cover quality.`
        : `Award-winning travel photograph of ${finalPlace} in ${finalCity}, ${country}. Shot during golden hour with natural warm lighting. Composition: wide establishing shot showing the most iconic and recognizable view that tourists would see when approaching the site. Style: National Geographic cover quality, Canon EOS R5, 24-70mm f/2.8 lens. No people in the frame. No text, no watermarks, no logos, no overlays. Ultra sharp focus, rich natural colors, dramatic sky. Category: ${category || 'Historical'}.`;

      const { data: imgData } = await supabase.functions.invoke('generate-image', {
        body: {
          title: finalPlace,
          city: finalCity,
          country,
          category: category || (isBalloonMode ? 'Local Experience' : 'Historical'),
          prompt: imagePrompt,
        },
      });

      const primarySections = isBalloonMode
        ? [{
            title: balloonMasterTitle || finalPlace,
            description: combineBalloonScripts(scripts),
            audio_url: generatedAudio[0]?.audio_url || '',
            duration_seconds: generatedAudio.reduce((sum, item, idx) => sum + (item?.duration_seconds || sections[idx]?.estimated_minutes * 60 || 0), 0),
            language: primaryLangName,
            language_code: primaryLangCode,
            order_index: 0,
          }]
        : sections.map((section, idx) => ({
            title: section.title,
            description: scripts[idx],
            audio_url: generatedAudio[idx]?.audio_url || '',
            duration_seconds: generatedAudio[idx]?.duration_seconds || section.estimated_minutes * 60,
            language: primaryLangName,
            language_code: primaryLangCode,
            order_index: idx,
          }));

      setProgress({ step: 2, totalSteps: 2, message: 'Saving guide...' });
      const totalDuration = primarySections.reduce((sum, s) => sum + s.duration_seconds, 0);
      const guideTitle = isBalloonMode ? (balloonMasterTitle || finalPlace) : `${finalPlace} Audio Guide`;
      const guideDescription = isBalloonMode
        ? `Long-form balloon experience narration for ${finalPlace} in ${finalCity}, ${country}. Covers ${coveredValleys.join(', ')} with geology, culture, and hidden details in a single evergreen listen.`
        : `Explore ${finalPlace} in ${finalCity}, ${country}. Professional audio tour guide with ${sections.length} stops covering history, culture, and hidden stories.`;

      const { data: guideData, error: guideError } = await supabase.functions.invoke('create-guide', {
        body: {
          title: guideTitle,
          description: guideDescription,
          location: `${finalCity}, ${country}`,
          category: category || (isBalloonMode ? 'Local Experience' : 'Historical'),
          duration: Math.ceil(totalDuration / 60),
          difficulty: 'Easy',
          languages: selectedLanguages.map((c) => ELEVENLABS_LANGUAGES.find((l) => l.code === c)?.name || c),
          price_usd: parseInt(priceUsd, 10) || 499,
          image_content: null,
          image_urls: imgData?.image_url ? [imgData.image_url] : [],
          sections: primarySections,
          is_published: false,
          is_featured: false,
        },
      });

      if (guideError || !guideData?.guide) throw new Error('Failed to create guide');
      setResult({ shareUrl: guideData.guide.share_url || '', accessCode: guideData.guide.master_access_code || '', guideId: guideData.guide.id });
      setCurrentStep('done_review');
      toast.success('Guide created! Review before publishing.');
    } catch (error: any) {
      setCreationError({ message: error.message, step: 'finalize' });
      setCurrentStep('error');
    }
  };

  if (currentStep === 'form') {
    // Validation per step
    const step0Valid = !!guideType;
    const step1Valid = !!(country && finalCity && finalPlace);
    const step2Valid = selectedLanguages.length > 0 && (!isBalloonMode || coveredValleys.length > 0);

    const canNext = formStep === 0 ? step0Valid : formStep === 1 ? step1Valid : step2Valid;
    const priceDollars = (parseInt(priceUsd || '0', 10) / 100).toFixed(2);

    return (
      <div className="max-w-3xl space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              Auto Create Audio Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StepIndicator
              steps={[
                { label: 'Type', icon: Landmark },
                { label: 'Location', icon: MapPin },
                { label: 'Settings', icon: Settings },
              ]}
              currentStep={formStep}
            />
          </CardContent>
        </Card>

        {/* STEP 0: Guide Type */}
        {formStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What kind of guide are you creating?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleGuideTypeChange('standard')}
                  className={`rounded-xl border-2 p-5 text-left transition-all ${!isBalloonMode ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-muted/40'}`}
                >
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Landmark className="w-5 h-5 text-primary" />
                    Standard Tour
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Multi-section stops for museums, landmarks, and walking-style tours. 15-25 sections, 2-5 min each.</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleGuideTypeChange('balloon')}
                  className={`rounded-xl border-2 p-5 text-left transition-all ${isBalloonMode ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-muted/40'}`}
                >
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Wind className="w-5 h-5 text-primary" />
                    Balloon Flight Experience
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Long evergreen narration with valleys, geology, culture. 10-25 min continuous audio in chunks.</p>
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setFormStep(1)} disabled={!canNext}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 1: Location */}
        {formStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Where is the guide located?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs"><span className="bg-primary/10 text-primary rounded-full w-5 h-5 inline-flex items-center justify-center font-bold text-[10px]">1</span> Country</Label>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger><SelectValue placeholder="Select a country..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ALL_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {country && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><span className="bg-primary/10 text-primary rounded-full w-5 h-5 inline-flex items-center justify-center font-bold text-[10px]">2</span> {isBalloonMode ? 'City / Region' : 'City'}</Label>
                  {loadingCities ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading suggestions...
                    </div>
                  ) : cities.length > 0 ? (
                    <div className="space-y-2">
                      <Select value={city} onValueChange={handleCitySelect}>
                        <SelectTrigger><SelectValue placeholder={isBalloonMode ? 'Select a city or region...' : 'Select a city...'} /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {cities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name} — {c.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder={isBalloonMode ? 'Or type a region name...' : 'Or type a city name...'} value={cityInput} onChange={(e) => { setCityInput(e.target.value); setCity(''); }} />
                    </div>
                  ) : (
                    <Input placeholder={isBalloonMode ? 'Type city or region name...' : 'Type city name...'} value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
                  )}
                </div>
              )}

              {(city || cityInput) && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><span className="bg-primary/10 text-primary rounded-full w-5 h-5 inline-flex items-center justify-center font-bold text-[10px]">3</span> {isBalloonMode ? 'Experience / Destination' : 'Place / Attraction'}</Label>
                  {loadingAttractions ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading attractions...
                    </div>
                  ) : attractions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="max-h-[320px] overflow-y-auto border rounded-lg p-2 space-y-3">
                        {Object.entries(groupedAttractions).map(([group, items]) => (
                          <div key={group} className="space-y-1.5">
                            <div className="flex items-center gap-2 px-1">
                              <Badge variant="secondary">{group}</Badge>
                              <span className="text-xs text-muted-foreground">{items.length} ideas</span>
                            </div>
                            <div className="space-y-1.5">
                              {items.map((a) => (
                                <button
                                  key={a.name}
                                  type="button"
                                  onClick={() => handleAttractionSelect(a)}
                                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${place === a.name ? 'bg-primary/15 border-primary text-foreground' : 'border-transparent hover:bg-muted hover:border-border text-foreground'}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">{a.name}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">{a.type.replace(/_/g, ' ')}</Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-1">{a.significance}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Input placeholder={isBalloonMode ? 'Or type an experience name...' : 'Or type an attraction name...'} value={placeInput} onChange={(e) => { setPlaceInput(e.target.value); setPlace(''); }} />
                    </div>
                  ) : (
                    <Input placeholder={isBalloonMode ? 'Type experience name...' : 'Type attraction name...'} value={placeInput} onChange={(e) => setPlaceInput(e.target.value)} />
                  )}
                </div>
              )}

              {(place || placeInput) && (
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Auto-detected or select..." /></SelectTrigger>
                    <SelectContent>
                      {GUIDE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setFormStep(0)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setFormStep(2)} disabled={!canNext}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Settings */}
        {formStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Final settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Languages — chip picker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Languages className="w-3.5 h-3.5" /> Languages
                  <span className="text-xs text-muted-foreground font-normal">({selectedLanguages.length} selected)</span>
                </Label>
                <LanguagePicker selected={selectedLanguages} onChange={setSelectedLanguages} />
              </div>

              {/* Price in dollars */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm"><DollarSign className="w-3.5 h-3.5" /> Price (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceDollars}
                    onChange={(e) => {
                      const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                      setPriceUsd(String(isNaN(cents) ? 0 : cents));
                    }}
                    className="pl-7"
                    placeholder="4.99"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Stored as {priceUsd} cents</p>
              </div>

              {/* Balloon-specific settings */}
              {isBalloonMode && (
                <div className="space-y-5 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/0 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wind className="w-4 h-4 text-primary" />
                    Balloon Experience Settings
                  </div>

                  {/* Valleys as chips */}
                  <div className="space-y-2">
                    <Label className="text-xs">Covered Valleys ({coveredValleys.length} selected)</Label>
                    <div className="flex flex-wrap gap-2">
                      {BALLOON_VALLEYS.map((valley) => {
                        const active = coveredValleys.includes(valley);
                        return (
                          <button
                            key={valley}
                            type="button"
                            onClick={() => toggleValley(valley)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border-2 transition-all ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
                          >
                            {active && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {valley}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background/70 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Narration profile</span>
                      <Badge variant="secondary">{BALLOON_DEFAULT_THEME}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Target duration</span>
                      <Badge variant="outline">{BALLOON_DEFAULT_DURATION} min</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balloon guides use a fixed premium narration setup and are generated in chunked admin sections for easier upload management.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setFormStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={handlePlanSections} disabled={!canNext} className="gap-1">
                  <Sparkles className="w-4 h-4" />
                  {isBalloonMode ? 'Plan Balloon Narration' : 'Plan Sections'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (currentStep === 'plan_review') {
    const totalMinutes = plannedSections.reduce((sum, s) => sum + s.estimated_minutes, 0);
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>
              Review {isBalloonMode ? 'Balloon Plan' : 'Section Plan'} — {isBalloonMode ? '1 Master Script' : `${plannedSections.length} ${plannedSections.length === 1 ? 'Section' : 'Sections'}`} ({totalMinutes} min)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{finalPlace} — {finalCity}, {country}</span>
              {isBalloonMode && <Badge variant="secondary">Balloon narrator</Badge>}
              {isBalloonMode && <Badge variant="outline">{BALLOON_DEFAULT_THEME}</Badge>}
            </div>

            {isBalloonMode && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <p className="font-medium text-foreground">Coverage</p>
                <div className="flex flex-wrap gap-2">
                  {coveredValleys.map((valley) => <Badge key={valley} variant="secondary">{formatValleyName(valley)}</Badge>)}
                </div>
                <p className="text-muted-foreground">Master title: {balloonMasterTitle}. İç bloklar üretilecek ama finalde tek section olarak kaydedilecek.</p>
              </div>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {plannedSections.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.subtitle} • {s.estimated_minutes} min • {s.mood}</p>
                    {s.fun_fact && <p className="text-xs text-primary/70 mt-0.5">💡 {s.fun_fact}</p>}
                    {s.key_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.key_topics.slice(0, 6).map((topic) => <Badge key={topic} variant="outline">{topic}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleGenerateScripts} className="flex-1">
                Approve & Generate Scripts
              </Button>
              <Button variant="outline" onClick={() => { setCurrentStep('form'); setPlannedSections([]); }}>
                Back to Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'generating_scripts') {
    const percent = Math.max(5, Math.round((progress.step / Math.max(progress.totalSteps, 1)) * 100));
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Music className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Generating Scripts</h2>
              <p className="text-muted-foreground text-sm">{finalPlace} — {finalCity}, {country}</p>
            </div>
            <Progress value={percent} className="h-2" />
            <p className="text-sm font-medium">{progress.message}</p>
            {progress.detail && <p className="text-xs text-muted-foreground">{progress.detail}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'script_review') {
    const totalWords = isBalloonMode ? combinedBalloonWordCount : generatedScripts.reduce((sum, s) => sum + s.trim().split(/\s+/).filter(Boolean).length, 0);
    const totalMinutes = isBalloonMode ? combinedBalloonMinutes : Math.round(totalWords / 150);

    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Review Scripts — {isBalloonMode ? '1 Master Script' : `${generatedScripts.length} Sections`} ({totalMinutes} min, ~{totalWords} words)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{finalPlace} — {finalCity}, {country} • {primaryLangName}</p>

            {isBalloonMode && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Evergreen balloon narration</Badge>
                  <Badge variant="outline">Target {BALLOON_DEFAULT_DURATION} min</Badge>
                  {totalMinutes < BALLOON_DEFAULT_DURATION && <Badge variant="destructive">Script may be too short</Badge>}
                  {scriptWarnings.length > 0 && <Badge variant="destructive">Directional wording detected</Badge>}
                  {unexpectedBalloonValleys.length > 0 && <Badge variant="destructive">Unselected valley mention detected</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {balloonCoverage.map((item) => (
                    <Badge key={item.valley} variant={item.present ? 'secondary' : 'outline'}>
                      {item.present ? '✓' : '○'} {formatValleyName(item.valley)}
                    </Badge>
                  ))}
                </div>
                {unexpectedBalloonValleys.length > 0 && (
                  <p className="text-xs text-destructive">Review needed: {unexpectedBalloonValleys.map(formatValleyName).join(', ')} seçilmediği halde metinde geçiyor.</p>
                )}
              </div>
            )}

            {isBalloonMode ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-sm font-medium">{balloonMasterTitle}</p>
                  <p className="text-xs text-muted-foreground">Tek görünür script · iç üretim blokları birleşik gösterim</p>
                </div>
                <div className="p-3 space-y-3">
                  <textarea
                    value={combinedBalloonScript}
                    onChange={(e) => setGeneratedScripts([e.target.value])}
                    className="w-full min-h-[320px] max-h-[520px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{combinedBalloonScript.length} chars · {combinedBalloonWordCount} words</span>
                    <Button size="sm" variant="outline" disabled={regeneratingScript !== null} onClick={() => handleGenerateScripts()}>
                      <Music className="w-3.5 h-3.5 mr-1" />
                      Regenerate Master Script
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {generatedScripts.map((script, i) => {
                const words = script.trim().split(/\s+/).filter(Boolean).length;
                const chars = script.length;
                const flagged = DIRECTIONAL_WARNING_PATTERN.test(script);
                return (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedScript(expandedScript === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{plannedSections[i]?.title}</p>
                        <p className="text-xs text-muted-foreground">{words} words · ~{Math.round(words / 150)} min {flagged && <span className="text-destructive ml-1">⚠ review wording</span>}</p>
                      </div>
                      {regeneratingScript === i && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedScript === i ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedScript === i && (
                      <div className="px-3 pb-3 border-t space-y-2">
                        <textarea
                          value={script}
                          onChange={(e) => setGeneratedScripts((prev) => prev.map((s, idx) => idx === i ? e.target.value : s))}
                          className="w-full min-h-[220px] max-h-[420px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                        />
                        {flagged && (
                          <p className="text-xs text-destructive">This script includes wording that sounds too directional or live. Please review before audio generation.</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{chars} chars · {words} words</span>
                          <Button size="sm" variant="outline" disabled={regeneratingScript !== null} onClick={() => handleRegenerateScript(i)}>
                            {regeneratingScript === i ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Music className="w-3.5 h-3.5 mr-1" />}
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setCurrentStep('audio_upload')} className="flex-1">Approve Scripts & Upload Audio</Button>
              <Button variant="outline" onClick={() => { setCurrentStep('plan_review'); setGeneratedScripts([]); }}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'audio_upload') {
    const uploadedCount = generatedAudio.filter((a) => a?.audio_url).length;
    const totalSections = plannedSections.length;
    const allUploaded = uploadedCount >= totalSections;
    const totalDur = generatedAudio.reduce((sum, a) => sum + (a?.duration_seconds || 0), 0);

    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Upload Audio — {uploadedCount}/{totalSections} sections
              {totalDur > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({Math.floor(totalDur / 60)} min total)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground space-y-1">
              <p><strong>Workflow:</strong> Copy each script below, paste it into <a href="https://elevenlabs.io/app/speech-synthesis" target="_blank" rel="noopener noreferrer" className="text-primary underline">ElevenLabs</a>, generate audio with your preferred voice settings, download the MP3, and upload it here.</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {plannedSections.map((section, i) => {
                const hasAudio = generatedAudio[i]?.audio_url;
                const dur = generatedAudio[i]?.duration_seconds || 0;
                const words = (generatedScripts[i] || '').trim().split(/\s+/).filter(Boolean).length;

                return (
                  <div key={i} className={`border rounded-lg p-3 space-y-2 ${hasAudio ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${hasAudio ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                        {hasAudio ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{words} words · ~{Math.round(words / 150)} min</p>
                      </div>
                      <Button size="sm" variant="outline" className={`shrink-0 gap-1 text-xs ${copiedScript === i ? 'text-primary border-primary' : ''}`} onClick={() => handleCopyScript(i)}>
                        {copiedScript === i ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedScript === i ? 'Copied!' : 'Copy Script'}
                      </Button>
                    </div>

                    {hasAudio ? (
                      <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => playUploadedAudio(i)}>
                          {playingUploadAudio === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary truncate">Audio uploaded</p>
                          <p className="text-[10px] text-muted-foreground">{Math.floor(dur / 60)}:{String(Math.floor(dur % 60)).padStart(2, '0')}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive text-xs shrink-0" onClick={() => handleRemoveAudio(i)}>Remove</Button>
                      </div>
                    ) : (
                      <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingSection === i ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30'}`}>
                        {uploadingSection === i ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm text-primary">Uploading...</span></>
                        ) : (
                          <><Mic className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload MP3 (multiple files auto-merged)</span></>
                        )}
                        <input
                          type="file"
                          accept="audio/*"
                          multiple
                          className="hidden"
                          disabled={uploadingSection !== null}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) handleAudioUpload(i, files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleFinalize} className="flex-1" disabled={!allUploaded}>{allUploaded ? 'Finalize Guide' : `Upload ${totalSections - uploadedCount} more audio files`}</Button>
              <Button variant="outline" onClick={() => setCurrentStep('script_review')}>Back to Scripts</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'creating_image') {
    const pct = Math.round((progress.step / progress.totalSteps) * 100);
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Image className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Finalizing Guide</h2>
              <p className="text-muted-foreground text-sm">{finalPlace} — {finalCity}, {country}</p>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-sm font-medium">{progress.message}</p>
            {progress.detail && <p className="text-xs text-muted-foreground">{progress.detail}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'error' && creationError) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Creation Failed</h2>
              <p className="text-muted-foreground text-sm mb-3">An error occurred during the <strong>{creationError.step}</strong> step.</p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-left">
                <p className="text-sm text-destructive font-mono break-all">{creationError.message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setCreationError(null); setCurrentStep('form'); }}>Start Over</Button>
              {creationError.step === 'scripts' && generatedScripts.length > 0 && <Button onClick={() => { setCreationError(null); setCurrentStep('script_review'); }}>Back to Scripts</Button>}
              {creationError.step === 'audio' && generatedScripts.length > 0 && <Button onClick={() => { setCreationError(null); setCurrentStep('audio_upload'); }}>Back to Upload</Button>}
              {creationError.step === 'finalize' && generatedAudio.length > 0 && <Button onClick={() => { setCreationError(null); handleFinalize(); }}>Retry Finalize</Button>}
              {creationError.step === 'planning' && <Button onClick={() => { setCreationError(null); handlePlanSections(); }}>Retry Planning</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'done_review') {
    const handlePublish = async () => {
      if (!result) return;
      const { error } = await supabase.from('audio_guides').update({ is_published: true, is_standalone: true }).eq('id', result.guideId);
      if (error) {
        toast.error('Failed to publish');
        return;
      }
      toast.success('Guide published to site!');
      setCurrentStep('published');
    };

    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Guide Ready for Review</h2>
              <p className="text-muted-foreground text-sm">{finalPlace} — {finalCity}, {country}</p>
              <p className="text-xs text-muted-foreground mt-1">Preview the guide, then publish when ready.</p>
            </div>
            {result && (
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Preview Link (not yet public)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs flex-1 break-all">{result.shareUrl}</code>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.shareUrl); toast.success('Copied!'); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => window.open(result.shareUrl, '_blank')}>Preview Guide</Button>
                  <Button className="flex-1" onClick={handlePublish}>Publish to Site</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardContent className="py-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Guide Published!</h2>
            <p className="text-muted-foreground text-sm">Now visible on homepage, guides page, and destinations.</p>
          </div>
          {result && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Access Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 break-all">{result.shareUrl}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.shareUrl); toast.success('Copied!'); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-2">Access Code</p>
                <Badge variant="secondary">{result.accessCode}</Badge>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setCurrentStep('form'); setResult(null); setPlannedSections([]); setGeneratedScripts([]); setGeneratedAudio([]); }}>Create Another Guide</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
