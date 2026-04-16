import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mergeAudioFiles } from '@/utils/audioMerge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, MapPin, Landmark, Languages, DollarSign, Mic, Loader2, CheckCircle, Music, Image, Save, Copy, ChevronDown, Play, Pause } from 'lucide-react';
import { ALL_COUNTRIES, ELEVENLABS_LANGUAGES, GUIDE_CATEGORIES } from '@/data/countries-full';
import { toast } from 'sonner';

interface SuggestedCity {
  name: string;
  description: string;
}

interface SuggestedAttraction {
  name: string;
  type: string;
  description: string;
  suggested_category: string;
  significance: string;
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

interface CreationProgress {
  step: number;
  totalSteps: number;
  message: string;
  detail?: string;
}

export function AutoCreateGuide() {
  // Form state
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [place, setPlace] = useState('');
  const [placeInput, setPlaceInput] = useState('');
  const [category, setCategory] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [priceUsd, setPriceUsd] = useState('499');

  // Suggestion state
  const [cities, setCities] = useState<SuggestedCity[]>([]);
  const [attractions, setAttractions] = useState<SuggestedAttraction[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAttractions, setLoadingAttractions] = useState(false);

  // Creation state
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [progress, setProgress] = useState<CreationProgress>({ step: 0, totalSteps: 6, message: '' });
  const [result, setResult] = useState<{ shareUrl: string; accessCode: string; guideId: string } | null>(null);
  const [creationError, setCreationError] = useState<{ message: string; step: string } | null>(null);

  // Plan review state
  const [plannedSections, setPlannedSections] = useState<PlannedSection[]>([]);
  // Script review state
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [regeneratingScript, setRegeneratingScript] = useState<number | null>(null);
  // Audio review state
  const [generatedAudio, setGeneratedAudio] = useState<{ audio_url: string; duration_seconds: number }[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Audio upload state
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [playingUploadAudio, setPlayingUploadAudio] = useState<number | null>(null);
  const uploadAudioRef = useRef<HTMLAudioElement | null>(null);

  const primaryLangCode = selectedLanguages[0] || 'en';

  // Country selection → load cities
  const handleCountryChange = useCallback(async (countryName: string) => {
    setCountry(countryName);
    setCity('');
    setCityInput('');
    setPlace('');
    setPlaceInput('');
    setAttractions([]);
    setCities([]);

    if (!countryName) return;
    setLoadingCities(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-cities', {
        body: { country: countryName }
      });
      if (!error && data?.cities) {
        setCities(data.cities);
      }
    } catch {
      // Silently fail - user can type manually
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // City selection → load attractions
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
        body: { country, city: cityName }
      });
      if (!error && data?.attractions) {
        setAttractions(data.attractions);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingAttractions(false);
    }
  }, [country]);

  // Attraction selection → set category
  const handleAttractionSelect = useCallback((attraction: SuggestedAttraction) => {
    setPlace(attraction.name);
    setPlaceInput(attraction.name);
    if (attraction.suggested_category) {
      setCategory(attraction.suggested_category);
    }
  }, []);

  // Language toggle
  const toggleLanguage = useCallback((langCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langCode)) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== langCode);
      }
      return [...prev, langCode];
    });
  }, []);

  // Form validation
  const isFormValid = country && (city || cityInput) && (place || placeInput) && selectedLanguages.length > 0;

  // === STEP 1: PLAN SECTIONS (before creation) ===
  const handlePlanSections = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('generating_scripts');
    setProgress({ step: 1, totalSteps: 1, message: 'Researching location and planning sections...' });

    try {
      const { data: planData, error: planError } = await supabase.functions.invoke('plan-guide-sections', {
        body: { country, city: finalCity, place: finalPlace, place_type: '', category: category || 'Historical' }
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

  // === STEP 2: CREATE GUIDE (after plan approval) ===
  // === STEP 2B: GENERATE SCRIPTS (after plan approval, before audio) ===
  const handleGenerateScripts = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('generating_scripts');
    const primaryLang = selectedLanguages[0];
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';
    const sections = plannedSections;

    try {
      const scripts: string[] = [];
      const scriptStartTime = Date.now();
      for (let i = 0; i < sections.length; i++) {
        const elapsed = Math.floor((Date.now() - scriptStartTime) / 1000);
        const perSection = i > 0 ? elapsed / i : 15;
        const remaining = Math.ceil((sections.length - i) * perSection);
        setProgress({
          step: 1, totalSteps: 1,
          message: `Writing narration scripts...`,
          detail: `Section ${i + 1}/${sections.length} · ~${remaining}s remaining`
        });

        const prevScript = i > 0 ? scripts[i - 1] : null;
        const previousEnding = prevScript ? prevScript.slice(-500) : null;
        const previousOpening = prevScript ? prevScript.split('.')[0] + '.' : null;

        // Collect ALL previous openings to prevent repetition
        const allPreviousOpenings = scripts.map((s, idx) => `Section ${idx + 1}: "${s.split('.')[0]}."`).join('\n');

        const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-section-script', {
          body: {
            country, city: finalCity, place: finalPlace,
            section: sections[i],
            previous_ending: previousEnding,
            previous_opening: previousOpening,
            previous_openings_list: allPreviousOpenings || null,
            next_title: i < sections.length - 1 ? sections[i + 1].title : null,
            language: primaryLangName
          }
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

  // === REGENERATE SINGLE SCRIPT ===
  const handleRegenerateScript = async (index: number) => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    const primaryLang = selectedLanguages[0];
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';
    const sections = plannedSections;

    setRegeneratingScript(index);
    try {
      const prevScript = index > 0 ? generatedScripts[index - 1] : null;
      const allPreviousOpenings = generatedScripts.slice(0, index).map((s, idx) => `Section ${idx + 1}: "${s.split('.')[0]}."`).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-section-script', {
        body: {
          country, city: finalCity, place: finalPlace,
          section: sections[index],
          previous_ending: prevScript ? prevScript.slice(-500) : null,
          previous_opening: prevScript ? prevScript.split('.')[0] + '.' : null,
          previous_openings_list: allPreviousOpenings || null,
          next_title: index < sections.length - 1 ? sections[index + 1].title : null,
          language: primaryLangName
        }
      });
      if (error || !data?.script) throw new Error('Regeneration failed');
      setGeneratedScripts(prev => prev.map((s, i) => i === index ? data.script : s));
      toast.success(`Section ${index + 1} script regenerated`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRegeneratingScript(null);
    }
  };

  // === REGENERATE SINGLE AUDIO ===
  // === AUDIO UPLOAD HELPERS ===

  const handleCopyScript = async (index: number) => {
    try {
      await navigator.clipboard.writeText(generatedScripts[index]);
      setCopiedScript(index);
      toast.success('Script copied! Paste it in ElevenLabs');
      setTimeout(() => setCopiedScript(null), 3000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleAudioUpload = async (index: number, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploadingSection(index);
    try {
      // Merge multiple files or use single file directly
      const { blob, duration } = await mergeAudioFiles(fileArray);
      const path = `uploaded-${Date.now()}-${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage.from('guide-audio').upload(path, blob, { contentType: 'audio/mpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('guide-audio').getPublicUrl(path);
      setGeneratedAudio(prev => {
        const next = [...prev];
        while (next.length <= index) next.push({ audio_url: '', duration_seconds: 0 });
        next[index] = { audio_url: urlData.publicUrl, duration_seconds: duration };
        return next;
      });
      toast.success(fileArray.length > 1
        ? `${fileArray.length} files merged & uploaded for section ${index + 1}`
        : `Audio uploaded for section ${index + 1}`);
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    setUploadingSection(null);
  };

  const handleRemoveAudio = (index: number) => {
    if (uploadAudioRef.current) { uploadAudioRef.current.pause(); uploadAudioRef.current = null; }
    setPlayingUploadAudio(null);
    setGeneratedAudio(prev => prev.map((a, i) => i === index ? { audio_url: '', duration_seconds: 0 } : a));
  };

  const playUploadedAudio = (index: number) => {
    if (uploadAudioRef.current) { uploadAudioRef.current.pause(); uploadAudioRef.current = null; }
    if (playingUploadAudio === index) { setPlayingUploadAudio(null); return; }
    const url = generatedAudio[index]?.audio_url;
    if (!url) return;
    const audio = new Audio(url);
    audio.onended = () => { setPlayingUploadAudio(null); uploadAudioRef.current = null; };
    audio.play();
    setPlayingUploadAudio(index);
    uploadAudioRef.current = audio;
  };

  // === STEP 3: CREATE IMAGE + SAVE (after audio upload) ===
  const handleFinalize = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('creating_image');
    const primaryLang = selectedLanguages[0];
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';
    const sections = plannedSections;
    const scripts = generatedScripts;

    try {
      setProgress({ step: 1, totalSteps: 2, message: 'Generating cover image...' });
      const { data: imgData } = await supabase.functions.invoke('generate-image', {
        body: {
          title: finalPlace, city: finalCity, country,
          category: category || 'Historical',
          prompt: `Award-winning travel photograph of ${finalPlace} in ${finalCity}, ${country}. Shot during golden hour with natural warm lighting. Composition: wide establishing shot showing the most iconic and recognizable view that tourists would see when approaching the site. Style: National Geographic cover quality, Canon EOS R5, 24-70mm f/2.8 lens. No people in the frame. No text, no watermarks, no logos, no overlays. Ultra sharp focus, rich natural colors, dramatic sky. Category: ${category || 'Historical'}.`
        }
      });
      setImageUrl(imgData?.image_url || null);

      // Build sections from uploaded audio
      const primarySections = sections.map((section, idx) => ({
        title: section.title,
        description: scripts[idx],
        audio_url: generatedAudio[idx]?.audio_url || '',
        duration_seconds: generatedAudio[idx]?.duration_seconds || section.estimated_minutes * 60,
        language: primaryLangName,
        language_code: primaryLang,
        order_index: idx
      }));

      // Save to database
      setProgress({ step: 2, totalSteps: 2, message: 'Saving guide...' });
      const totalDuration = primarySections.reduce((sum, s) => sum + s.duration_seconds, 0);
      const guideTitle = `${finalPlace} Audio Guide`;
      const guideDescription = `Explore ${finalPlace} in ${finalCity}, ${country}. Professional audio tour guide with ${sections.length} stops covering history, culture, and hidden stories.`;

      const { data: guideData, error: guideError } = await supabase.functions.invoke('create-guide', {
        body: {
          title: guideTitle, description: guideDescription,
          location: `${finalCity}, ${country}`, category: category || 'Historical',
          duration: Math.ceil(totalDuration / 60), difficulty: 'Easy',
          languages: selectedLanguages.map(c => ELEVENLABS_LANGUAGES.find(l => l.code === c)?.name || c),
          price_usd: parseInt(priceUsd) || 499,
          image_content: null, image_urls: imgData?.image_url ? [imgData.image_url] : [],
          sections: primarySections, is_published: false, is_featured: false
        }
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

  // === RENDER: FORM ===
  if (currentStep === 'form') {
    return (
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Auto Create Audio Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Country */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Country</Label>
              <Select value={country} onValueChange={handleCountryChange}>
                <SelectTrigger><SelectValue placeholder="Select a country..." /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {ALL_COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            {country && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> City</Label>
                {loadingCities ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading cities...
                  </div>
                ) : cities.length > 0 ? (
                  <div className="space-y-2">
                    <Select value={city} onValueChange={handleCitySelect}>
                      <SelectTrigger><SelectValue placeholder="Select a city..." /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {cities.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name} — {c.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or type a city name..."
                      value={cityInput}
                      onChange={(e) => { setCityInput(e.target.value); setCity(''); }}
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="Type city name..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Attraction */}
            {(city || cityInput) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Place / Attraction</Label>
                {loadingAttractions ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading attractions...
                  </div>
                ) : attractions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                      {attractions.map(a => (
                        <button
                          key={a.name}
                          onClick={() => handleAttractionSelect(a)}
                          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            place === a.name
                              ? 'bg-primary/15 border border-primary text-primary'
                              : 'hover:bg-muted border border-transparent'
                          }`}
                        >
                          <span className="font-medium">{a.name}</span>
                          <span className="text-muted-foreground ml-1.5">— {a.description}</span>
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Or type an attraction name..."
                      value={placeInput}
                      onChange={(e) => { setPlaceInput(e.target.value); setPlace(''); }}
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="Type attraction name..."
                    value={placeInput}
                    onChange={(e) => setPlaceInput(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Category */}
            {(place || placeInput) && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Auto-detected or select..." /></SelectTrigger>
                  <SelectContent>
                    {GUIDE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Languages (select first, then assign voices) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Languages ({selectedLanguages.length} selected)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                {ELEVENLABS_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedLanguages.includes(lang.code)
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Note: Voice selection removed — audio files are uploaded manually from ElevenLabs */}

            {/* Price */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Price (USD cents)</Label>
              <Input
                type="number"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="499 = $4.99"
              />
              <p className="text-xs text-muted-foreground">Price: ${(parseInt(priceUsd) / 100).toFixed(2)}</p>
            </div>

            {/* Plan Button */}
            <Button
              onClick={handlePlanSections}
              disabled={!isFormValid}
              className="w-full h-12 text-base"
            >
              Plan Sections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: PLAN REVIEW ===
  if (currentStep === 'plan_review') {
    const totalMinutes = plannedSections.reduce((sum, s) => sum + s.estimated_minutes, 0);
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Review Section Plan — {plannedSections.length} Sections ({totalMinutes} min)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{place || placeInput} — {city || cityInput}, {country}</p>
            <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {plannedSections.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.subtitle} • {s.estimated_minutes} min • {s.mood}</p>
                    {s.fun_fact && <p className="text-xs text-primary/70 mt-0.5">💡 {s.fun_fact}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleGenerateScripts} className="flex-1">
                Approve & Generate Scripts ({plannedSections.length} sections)
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

  // === RENDER: GENERATING SCRIPTS ===
  if (currentStep === 'generating_scripts') {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Music className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Generating Scripts</h2>
              <p className="text-muted-foreground text-sm">{place || placeInput} — {city || cityInput}, {country}</p>
            </div>
            <Progress value={progress.detail ? (parseInt(progress.detail) / plannedSections.length) * 100 : 0} className="h-2" />
            <p className="text-sm font-medium">{progress.message}</p>
            {progress.detail && <p className="text-xs text-muted-foreground">{progress.detail}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: SCRIPT REVIEW ===
  if (currentStep === 'script_review') {
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === selectedLanguages[0])?.name || 'English';
    const totalWords = generatedScripts.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    const totalMinutes = Math.round(totalWords / 150);

    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Review Scripts — {generatedScripts.length} Sections ({totalMinutes} min, ~{totalWords} words)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {place || placeInput} — {city || cityInput}, {country} • {primaryLangName} • Edit scripts below, then approve
            </p>
            <div className="max-h-[600px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {generatedScripts.map((script, i) => {
                const words = script.split(/\s+/).length;
                const chars = script.length;
                const isLong = chars > 4000;
                return (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedScript(expandedScript === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{plannedSections[i]?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {words} words · ~{Math.round(words / 150)} min
                          {isLong && <span className="text-destructive ml-1">⚠ too long</span>}
                        </p>
                      </div>
                      {regeneratingScript === i && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedScript === i ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedScript === i && (
                      <div className="px-3 pb-3 border-t space-y-2">
                        <textarea
                          value={script}
                          onChange={(e) => setGeneratedScripts(prev => prev.map((s, idx) => idx === i ? e.target.value : s))}
                          className="w-full min-h-[200px] max-h-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{chars} chars · {words} words</span>
                          <Button
                            size="sm" variant="outline"
                            disabled={regeneratingScript !== null}
                            onClick={() => handleRegenerateScript(i)}
                          >
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
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setCurrentStep('audio_upload')} className="flex-1">
                Approve Scripts & Upload Audio
              </Button>
              <Button variant="outline" onClick={() => { setCurrentStep('plan_review'); setGeneratedScripts([]); }}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: AUDIO UPLOAD ===
  if (currentStep === 'audio_upload') {
    const uploadedCount = generatedAudio.filter(a => a?.audio_url).length;
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
                const words = (generatedScripts[i] || '').split(/\s+/).length;

                return (
                  <div key={i} className={`border rounded-lg p-3 space-y-2 ${hasAudio ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${hasAudio ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'}`}>
                        {hasAudio ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{words} words · ~{Math.round(words / 150)} min</p>
                      </div>
                      <Button
                        size="sm" variant="outline"
                        className={`shrink-0 gap-1 text-xs ${copiedScript === i ? 'text-green-600 border-green-500' : ''}`}
                        onClick={() => handleCopyScript(i)}
                      >
                        {copiedScript === i ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedScript === i ? 'Copied!' : 'Copy Script'}
                      </Button>
                    </div>

                    {/* Audio upload area */}
                    {hasAudio ? (
                      <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => playUploadedAudio(i)}>
                          {playingUploadAudio === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-600 truncate">Audio uploaded</p>
                          <p className="text-[10px] text-muted-foreground">{Math.floor(dur / 60)}:{String(Math.floor(dur % 60)).padStart(2, '0')}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive text-xs shrink-0" onClick={() => handleRemoveAudio(i)}>
                          Remove
                        </Button>
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
              <Button onClick={handleFinalize} className="flex-1" disabled={!allUploaded}>
                {allUploaded ? 'Finalize Guide' : `Upload ${totalSections - uploadedCount} more audio files`}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep('script_review')}>
                Back to Scripts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: CREATING IMAGE ===
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
              <p className="text-muted-foreground text-sm">{place || placeInput} — {city || cityInput}, {country}</p>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-sm font-medium">{progress.message}</p>
            {progress.detail && <p className="text-xs text-muted-foreground">{progress.detail}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: ERROR ===
  if (currentStep === 'error' && creationError) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Creation Failed</h2>
              <p className="text-muted-foreground text-sm mb-3">
                An error occurred during the <strong>{creationError.step}</strong> step.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-left">
                <p className="text-sm text-destructive font-mono break-all">{creationError.message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setCreationError(null); setCurrentStep('form'); }}>
                Start Over
              </Button>
              {creationError.step === 'scripts' && generatedScripts.length > 0 && (
                <Button onClick={() => { setCreationError(null); setCurrentStep('script_review'); }}>
                  Back to Scripts
                </Button>
              )}
              {creationError.step === 'audio' && generatedScripts.length > 0 && (
                <Button onClick={() => { setCreationError(null); setCurrentStep('audio_upload'); }}>
                  Back to Upload
                </Button>
              )}
              {creationError.step === 'finalize' && generatedAudio.length > 0 && (
                <Button onClick={() => { setCreationError(null); handleFinalize(); }}>
                  Retry Finalize
                </Button>
              )}
              {creationError.step === 'planning' && (
                <Button onClick={() => { setCreationError(null); handlePlanSections(); }}>
                  Retry Planning
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: DONE REVIEW (before publishing) ===
  if (currentStep === 'done_review') {
    const handlePublish = async () => {
      if (!result) return;
      const { error } = await supabase.from('audio_guides')
        .update({ is_published: true, is_standalone: true })
        .eq('id', result.guideId);
      if (error) { toast.error('Failed to publish'); return; }
      toast.success('Guide published to site!');
      setCurrentStep('published');
    };

    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Guide Ready for Review</h2>
              <p className="text-muted-foreground text-sm">{place || placeInput} — {city || cityInput}, {country}</p>
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
                  <Button variant="outline" className="flex-1" onClick={() => window.open(result.shareUrl, '_blank')}>
                    Preview Guide
                  </Button>
                  <Button className="flex-1" onClick={handlePublish}>
                    Publish to Site
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER: PUBLISHED ===
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardContent className="py-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
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
              <Button variant="outline" className="w-full" onClick={() => { setCurrentStep('form'); setResult(null); setPlannedSections([]); }}>
                Create Another Guide
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
