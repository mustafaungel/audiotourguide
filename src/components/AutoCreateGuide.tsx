import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, MapPin, Landmark, Languages, DollarSign, Mic, Loader2, CheckCircle, Music, Image, Save, Copy, ChevronDown } from 'lucide-react';
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

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  category: string;
  accent: string;
  description: string;
  preview_url: string | null;
}

type Step = 'form' | 'plan_review' | 'generating_scripts' | 'script_review' | 'creating' | 'done_review' | 'published';

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
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  // Per-language voice selection: { langCode: voiceId }
  const [voiceByLanguage, setVoiceByLanguage] = useState<Record<string, string>>({});
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

  // Plan review state
  const [plannedSections, setPlannedSections] = useState<PlannedSection[]>([]);
  // Script review state
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);

  // Voice preview
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Load voices on mount
  useEffect(() => {
    (async () => {
      setLoadingVoices(true);
      try {
        const { data, error } = await supabase.functions.invoke('list-voices', { body: {} });
        if (!error && data?.voices) {
          setVoices(data.voices);
          // Auto-assign first female voice to default language (English)
          const firstFemale = data.voices.find((v: Voice) => v.gender === 'female');
          if (firstFemale) {
            setVoiceByLanguage(prev => ({ ...prev, en: prev.en || firstFemale.voice_id }));
          }
        }
      } catch { /* silent */ }
      finally { setLoadingVoices(false); }
    })();
  }, []);

  // Filter voices by gender
  const filteredVoices = voices.filter(v => v.gender === voiceGender);

  // Set voice for a specific language
  const setVoiceForLang = useCallback((langCode: string, voiceId: string) => {
    setVoiceByLanguage(prev => ({ ...prev, [langCode]: voiceId }));
  }, []);

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

  // Language toggle - auto-assign a different voice for each new language
  const toggleLanguage = useCallback((langCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langCode)) {
        if (prev.length === 1) return prev;
        setVoiceByLanguage(vbl => { const copy = { ...vbl }; delete copy[langCode]; return copy; });
        return prev.filter(l => l !== langCode);
      }
      // Auto-assign a voice that isn't already used by another language
      const usedVoices = Object.values(voiceByLanguage);
      const available = filteredVoices.find(v => !usedVoices.includes(v.voice_id));
      if (available) {
        setVoiceByLanguage(vbl => ({ ...vbl, [langCode]: available.voice_id }));
      } else if (filteredVoices.length > 0) {
        // All voices used, pick by index
        const idx = prev.length % filteredVoices.length;
        setVoiceByLanguage(vbl => ({ ...vbl, [langCode]: filteredVoices[idx].voice_id }));
      }
      return [...prev, langCode];
    });
  }, [filteredVoices, voiceByLanguage]);

  // Live voice preview in selected language
  const PREVIEW_SENTENCES: Record<string, string> = {
    en: 'Welcome to this audio tour. Let me guide you through centuries of history and culture.',
    es: 'Bienvenidos a este recorrido de audio. Permítanme guiarles a través de siglos de historia y cultura.',
    fr: 'Bienvenue dans cette visite audio. Laissez-moi vous guider à travers des siècles d\'histoire et de culture.',
    de: 'Willkommen zu dieser Audio-Tour. Lassen Sie mich Sie durch Jahrhunderte von Geschichte und Kultur führen.',
    it: 'Benvenuti in questo tour audio. Lasciate che vi guidi attraverso secoli di storia e cultura.',
    pt: 'Bem-vindos a este passeio de áudio. Deixem-me guiá-los através de séculos de história e cultura.',
    zh: '欢迎来到这次语音导览。让我带您穿越几个世纪的历史和文化。',
    ja: 'このオーディオツアーへようこそ。何世紀にもわたる歴史と文化をご案内させていただきます。',
    ko: '이 오디오 투어에 오신 것을 환영합니다. 수세기에 걸친 역사와 문화를 안내해 드리겠습니다.',
    hi: 'इस ऑडियो टूर में आपका स्वागत है। मुझे सदियों के इतिहास और संस्कृति के माध्यम से आपका मार्गदर्शन करने दें।',
    ar: 'مرحبًا بكم في هذه الجولة الصوتية. دعوني أرشدكم عبر قرون من التاريخ والثقافة.',
    ru: 'Добро пожаловать в этот аудиотур. Позвольте мне провести вас сквозь века истории и культуры.',
    nl: 'Welkom bij deze audiotour. Laat mij u door eeuwen van geschiedenis en cultuur leiden.',
    pl: 'Witamy w tej wycieczce audio. Pozwólcie, że oprowadzę was przez wieki historii i kultury.',
    sv: 'Välkommen till denna audiotur. Låt mig guida dig genom århundraden av historia och kultur.',
    tr: 'Bu sesli tura hoş geldiniz. Yüzyıllar boyunca süregelen tarih ve kültür boyunca size rehberlik edeyim.',
  };
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null);

  const playVoicePreview = useCallback(async (voiceId: string, langCode: string) => {
    if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); }
    if (playingPreview === `${voiceId}_${langCode}`) { setPlayingPreview(null); return; }

    const previewKey = `${voiceId}_${langCode}`;
    setGeneratingPreview(previewKey);

    try {
      const text = PREVIEW_SENTENCES[langCode] || PREVIEW_SENTENCES.en;
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text, voiceId, modelId: 'eleven_multilingual_v2', isPreview: true }
      });
      if (error || !data?.audio_url) { toast.error('Preview failed'); return; }

      const audio = new Audio(data.audio_url);
      audio.onended = () => { setPlayingPreview(null); setPreviewAudio(null); };
      await audio.play();
      setPlayingPreview(previewKey);
      setPreviewAudio(audio);
    } catch {
      toast.error('Preview failed');
    } finally {
      setGeneratingPreview(null);
    }
  }, [previewAudio, playingPreview]);

  // Form validation
  const isFormValid = country && (city || cityInput) && (place || placeInput) && selectedLanguages.length > 0;

  // === STEP 1: PLAN SECTIONS (before creation) ===
  const handlePlanSections = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('creating');
    setProgress({ step: 1, totalSteps: 1, message: 'Researching location and planning sections...' });

    try {
      const { data: planData, error: planError } = await supabase.functions.invoke('plan-guide-sections', {
        body: { country, city: finalCity, place: finalPlace, place_type: '', category: category || 'Historical' }
      });
      if (planError || !planData?.sections) throw new Error('Failed to plan sections');
      setPlannedSections(planData.sections);
      setCurrentStep('plan_review');
    } catch (error: any) {
      toast.error(`Planning failed: ${error.message}`);
      setCurrentStep('form');
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
      for (let i = 0; i < sections.length; i++) {
        setProgress({
          step: 1, totalSteps: 1,
          message: `Writing narration scripts...`,
          detail: `${i + 1}/${sections.length} sections complete`
        });

        const prevScript = i > 0 ? scripts[i - 1] : null;
        const previousEnding = prevScript ? prevScript.slice(-500) : null;
        const previousOpening = prevScript ? prevScript.split('.')[0] + '.' : null;

        const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-section-script', {
          body: {
            country, city: finalCity, place: finalPlace,
            section: sections[i],
            previous_ending: previousEnding,
            previous_opening: previousOpening,
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
      toast.error(`Script generation failed: ${error.message}`);
      setCurrentStep('plan_review');
    }
  };

  // === STEP 3: CREATE AUDIO + IMAGE (after script approval) ===
  const handleStartCreation = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('creating');
    const defaultVoice = voiceGender === 'female' ? '9BWtsMINqrJLrRacOk9x' : 'pNInz6obpgDQGcFmaJgB';
    const primaryLang = selectedLanguages[0];
    const getVoiceForLang = (langCode: string) => voiceByLanguage[langCode] || defaultVoice;
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';
    const sections = plannedSections;
    const scripts = generatedScripts;

    try {
      // Step 1: Generate cover image
      setProgress({ step: 1, totalSteps: 4, message: 'Generating cover image...' });
      const { data: imageData } = await supabase.functions.invoke('generate-image', {
        body: {
          title: finalPlace,
          city: finalCity,
          country,
          category: category || 'Historical',
          prompt: `Ultra-realistic professional travel photography of ${finalPlace} in ${finalCity}, ${country}. Golden hour lighting, National Geographic quality, showcasing the most iconic and breathtaking view. Vibrant colors, sharp focus, cinematic composition. No text, no watermarks.`
        }
      });
      const imageUrl = imageData?.image_url || null;

      // Step 4: Generate audio for primary language
      const primarySections: { title: string; description: string; audio_url: string; duration_seconds: number; language: string; language_code: string; order_index: number }[] = [];
      for (let i = 0; i < sections.length; i++) {
        setProgress({
          step: 2, totalSteps: 4,
          message: `Producing audio files...`,
          detail: `${primaryLangName}: ${i + 1}/${sections.length}`
        });
        const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
          body: { text: scripts[i], voiceId: getVoiceForLang(primaryLang), modelId: 'eleven_multilingual_v2' }
        });
        if (audioError || !audioData?.audio_url) throw new Error(`Failed to generate audio for section ${i + 1}`);
        primarySections.push({
          title: sections[i].title,
          description: scripts[i],
          audio_url: audioData.audio_url,
          duration_seconds: audioData.duration_seconds || sections[i].estimated_minutes * 60,
          language: primaryLangName,
          language_code: primaryLang,
          order_index: i
        });
      }

      // Step 5: Generate translations + audio for other languages
      const additionalSections: typeof primarySections = [];
      const otherLangs = selectedLanguages.filter(l => l !== primaryLang);
      for (const langCode of otherLangs) {
        const langName = ELEVENLABS_LANGUAGES.find(l => l.code === langCode)?.name || langCode;
        for (let i = 0; i < sections.length; i++) {
          setProgress({
            step: 3, totalSteps: 4,
            message: `Producing multilingual audio...`,
            detail: `${langName}: ${i + 1}/${sections.length}`
          });
          // Translate
          const { data: transData } = await supabase.functions.invoke('translate-script', {
            body: {
              script: scripts[i],
              source_language: primaryLangName,
              target_language: langName,
              place: finalPlace,
              section_title: sections[i].title
            }
          });
          const translatedScript = transData?.translated_script || scripts[i];
          // Generate audio
          const { data: audioData } = await supabase.functions.invoke('generate-audio', {
            body: { text: translatedScript, voiceId: getVoiceForLang(langCode), modelId: 'eleven_multilingual_v2' }
          });
          additionalSections.push({
            title: sections[i].title,
            description: translatedScript,
            audio_url: audioData?.audio_url || '',
            duration_seconds: audioData?.duration_seconds || sections[i].estimated_minutes * 60,
            language: langName,
            language_code: langCode,
            order_index: i
          });
        }
      }

      // Step 6: Create guide in database
      setProgress({ step: 4, totalSteps: 4, message: 'Saving guide...' });
      const allSections = [...primarySections, ...additionalSections];
      const totalDuration = primarySections.reduce((sum, s) => sum + s.duration_seconds, 0);

      // SEO-friendly title and description
      const guideTitle = `${finalPlace} Audio Guide`;
      const guideDescription = `Explore ${finalPlace} in ${finalCity}, ${country}. Professional audio tour guide with ${sections.length} stops covering history, culture, and hidden stories.`;

      const { data: guideData, error: guideError } = await supabase.functions.invoke('create-guide', {
        body: {
          title: guideTitle,
          description: guideDescription,
          location: `${finalCity}, ${country}`,
          category: category || 'Historical',
          duration: Math.ceil(totalDuration / 60),
          difficulty: 'Easy',
          languages: selectedLanguages.map(c => ELEVENLABS_LANGUAGES.find(l => l.code === c)?.name || c),
          price_usd: parseInt(priceUsd) || 499,
          image_content: null,
          image_urls: imageUrl ? [imageUrl] : [],
          sections: allSections,
          is_published: false,
          is_featured: false
        }
      });

      if (guideError || !guideData?.guide) throw new Error('Failed to create guide');

      setResult({
        shareUrl: guideData.guide.share_url || '',
        accessCode: guideData.guide.master_access_code || '',
        guideId: guideData.guide.id
      });
      setCurrentStep('done_review');
      toast.success('Guide created! Review before publishing.');

    } catch (error: any) {
      toast.error(`Creation failed: ${error.message}`);
      setCurrentStep('form');
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

            {/* Per-language Voice Selection */}
            {selectedLanguages.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Voice per Language</Label>
                <div className="flex gap-3 mb-1">
                  <button
                    onClick={() => setVoiceGender('female')}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      voiceGender === 'female' ? 'bg-primary/15 border-primary text-primary ring-2 ring-primary/30' : 'border-border hover:bg-muted'
                    }`}
                  >Female</button>
                  <button
                    onClick={() => setVoiceGender('male')}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      voiceGender === 'male' ? 'bg-primary/15 border-primary text-primary ring-2 ring-primary/30' : 'border-border hover:bg-muted'
                    }`}
                  >Male</button>
                </div>
                {loadingVoices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading voices...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLanguages.map(langCode => {
                      const langInfo = ELEVENLABS_LANGUAGES.find(l => l.code === langCode);
                      const selectedVoice = voiceByLanguage[langCode] || '';
                      return (
                        <div key={langCode} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-24 shrink-0 truncate">{langInfo?.flag} {langInfo?.name}</span>
                          <Select value={selectedVoice} onValueChange={(v) => setVoiceForLang(langCode, v)}>
                            <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue placeholder="Select voice..." /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {filteredVoices.map(v => (
                                <SelectItem key={v.voice_id} value={v.voice_id}>
                                  {v.name} {v.accent !== 'unknown' ? `(${v.accent})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedVoice && (
                            <Button variant="ghost" size="sm" className="shrink-0 px-2"
                              disabled={generatingPreview === `${selectedVoice}_${langCode}`}
                              onClick={() => playVoicePreview(selectedVoice, langCode)}>
                              {generatingPreview === `${selectedVoice}_${langCode}` ? <Loader2 className="w-3 h-3 animate-spin" /> : playingPreview === `${selectedVoice}_${langCode}` ? '⏹' : '▶'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
              {place || placeInput} — {city || cityInput}, {country} • {primaryLangName}
            </p>
            <div className="max-h-[500px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {generatedScripts.map((script, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedScript(expandedScript === i ? null : i)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{plannedSections[i]?.title}</p>
                      <p className="text-xs text-muted-foreground">{script.split(/\s+/).length} words • ~{Math.round(script.split(/\s+/).length / 150)} min</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedScript === i ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedScript === i && (
                    <div className="px-3 pb-3 border-t">
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line max-h-[300px] overflow-y-auto pt-2">
                        {script}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleStartCreation} className="flex-1">
                Approve Scripts & Start Audio Production ({selectedLanguages.length} language{selectedLanguages.length > 1 ? 's' : ''})
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

  // === RENDER: CREATING ===
  if (currentStep === 'creating') {
    const pct = Math.round((progress.step / progress.totalSteps) * 100);
    const stepIcons = [null, Globe, Music, Image, Mic, Languages, Save];
    const StepIcon = stepIcons[progress.step] || Loader2;

    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <StepIcon className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Creating Audio Guide</h2>
              <p className="text-muted-foreground text-sm">{place || placeInput} — {city || cityInput}, {country}</p>
            </div>
            <Progress value={pct} className="h-2" />
            <div>
              <p className="text-sm font-medium">[Step {progress.step}/{progress.totalSteps}] {progress.message}</p>
              {progress.detail && <p className="text-xs text-muted-foreground mt-1">{progress.detail}</p>}
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
