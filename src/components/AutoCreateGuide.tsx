import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  category: string;
  accent: string;
  description: string;
  preview_url: string | null;
  languages: string[];
}

type Step = 'form' | 'plan_review' | 'generating_scripts' | 'script_review' | 'creating_audio' | 'audio_review' | 'creating_image' | 'done_review' | 'published' | 'error';

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
  const [creationError, setCreationError] = useState<{ message: string; step: string } | null>(null);

  // Plan review state
  const [plannedSections, setPlannedSections] = useState<PlannedSection[]>([]);
  // Script review state
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [regeneratingScript, setRegeneratingScript] = useState<number | null>(null);
  // Audio review state
  const [generatedAudio, setGeneratedAudio] = useState<{ audio_url: string; duration_seconds: number }[]>([]);
  const [regeneratingAudio, setRegeneratingAudio] = useState<number | null>(null);
  const [reviewAudio, setReviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSection, setPlayingSection] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Voice preview
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Load voices when primary language changes
  const primaryLangCode = selectedLanguages[0] || 'en';
  const primaryLangNameForVoices = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLangCode)?.name || 'English';

  useEffect(() => {
    (async () => {
      setLoadingVoices(true);
      try {
        const { data, error } = await supabase.functions.invoke('list-voices', { body: { language: primaryLangNameForVoices } });
        if (!error && data?.voices) {
          setVoices(data.voices);
          const firstFemale = data.voices.find((v: Voice) => v.gender === 'female');
          if (firstFemale) {
            setVoiceByLanguage(prev => ({ ...prev, [primaryLangCode]: prev[primaryLangCode] || firstFemale.voice_id }));
          }
        }
      } catch { /* silent */ }
      finally { setLoadingVoices(false); }
    })();
  }, [primaryLangNameForVoices]);

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
      // Auto-assign: prefer native voice for this language, then unused voice
      const usedVoices = Object.values(voiceByLanguage);
      const nativeVoices = filteredVoices.filter(v => v.languages?.includes(langCode));
      const nativeAvailable = nativeVoices.find(v => !usedVoices.includes(v.voice_id));
      const anyAvailable = filteredVoices.find(v => !usedVoices.includes(v.voice_id));
      const picked = nativeAvailable || anyAvailable || filteredVoices[prev.length % Math.max(1, filteredVoices.length)];
      if (picked) {
        setVoiceByLanguage(vbl => ({ ...vbl, [langCode]: picked.voice_id }));
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
      // Use ElevenLabs preview_url if available (instant, no API credits used)
      const voice = voices.find(v => v.voice_id === voiceId);
      let audioUrl = voice?.preview_url;

      if (!audioUrl) {
        // Fallback: generate preview via edge function
        const text = PREVIEW_SENTENCES[langCode] || PREVIEW_SENTENCES.en;
        const { data, error } = await supabase.functions.invoke('generate-audio', {
          body: { text, voiceId, modelId: 'eleven_multilingual_v2', isPreview: true }
        });
        if (error || !data?.audio_url) {
          toast.error(`Preview failed: ${error?.message || data?.error || 'No audio URL'}`);
          return;
        }
        audioUrl = data.audio_url;
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => { setPlayingPreview(null); setPreviewAudio(null); };
      audio.onerror = () => { toast.error('Audio playback failed'); setPlayingPreview(null); setGeneratingPreview(null); };
      await audio.play();
      setPlayingPreview(previewKey);
      setPreviewAudio(audio);
    } catch (e: any) {
      toast.error(`Preview error: ${e?.message || 'Unknown'}`);
    } finally {
      setGeneratingPreview(null);
    }
  }, [previewAudio, playingPreview, voices]);

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
  const handleRegenerateAudio = async (index: number) => {
    const primaryLang = selectedLanguages[0];
    const defaultVoice = voiceGender === 'female' ? '9BWtsMINqrJLrRacOk9x' : 'pNInz6obpgDQGcFmaJgB';
    const voiceId = voiceByLanguage[primaryLang] || defaultVoice;

    setRegeneratingAudio(index);
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text: generatedScripts[index], voiceId, modelId: 'eleven_multilingual_v2' }
      });
      if (error || !data?.audio_url) throw new Error('Audio regeneration failed');
      setGeneratedAudio(prev => prev.map((a, i) => i === index ? { audio_url: data.audio_url, duration_seconds: data.duration_seconds } : a));
      toast.success(`Section ${index + 1} audio regenerated`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRegeneratingAudio(null);
    }
  };

  // === PLAY SECTION AUDIO IN REVIEW ===
  const playSectionAudio = (index: number) => {
    if (reviewAudio) { reviewAudio.pause(); setReviewAudio(null); }
    if (playingSection === index) { setPlayingSection(null); return; }
    const audio = new Audio(generatedAudio[index]?.audio_url);
    audio.onended = () => { setPlayingSection(null); setReviewAudio(null); };
    audio.play();
    setPlayingSection(index);
    setReviewAudio(audio);
  };

  // === RETRY HELPER ===
  const generateAudioWithRetry = async (text: string, voiceId: string, maxRetries = 2): Promise<{ audio_url: string; duration_seconds: number } | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-audio', {
          body: { text, voiceId, modelId: 'eleven_multilingual_v2' }
        });
        if (!error && data?.audio_url) return data;
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000));
      }
    }
    return null;
  };

  // === STEP 3: CREATE AUDIO ONLY (after script approval) ===
  const handleStartAudioCreation = async () => {
    if (!country || !(city || cityInput) || !(place || placeInput)) return;

    setCurrentStep('creating_audio');
    const defaultVoice = voiceGender === 'female' ? '9BWtsMINqrJLrRacOk9x' : 'pNInz6obpgDQGcFmaJgB';
    const primaryLang = selectedLanguages[0];
    const voiceId = voiceByLanguage[primaryLang] || defaultVoice;
    const sections = plannedSections;
    const scripts = generatedScripts;
    const BATCH_SIZE = 3;

    try {
      const audioResults: { audio_url: string; duration_seconds: number }[] = [];
      const audioStartTime = Date.now();

      for (let i = 0; i < sections.length; i += BATCH_SIZE) {
        const batch = sections.slice(i, Math.min(i + BATCH_SIZE, sections.length));
        const done = Math.min(i + BATCH_SIZE, sections.length);
        const elapsed = Math.floor((Date.now() - audioStartTime) / 1000);
        const perBatch = i > 0 ? elapsed / (i / BATCH_SIZE) : 20;
        const remaining = Math.ceil(((sections.length - done) / BATCH_SIZE) * perBatch);
        setProgress({
          step: 1, totalSteps: 2,
          message: `Producing audio files...`,
          detail: `${done}/${sections.length} · ~${remaining}s remaining`
        });
        const results = await Promise.all(batch.map((_, batchIdx) => {
          const idx = i + batchIdx;
          return generateAudioWithRetry(scripts[idx], voiceId);
        }));
        for (const r of results) {
          audioResults.push(r || { audio_url: '', duration_seconds: 0 });
        }
      }

      setGeneratedAudio(audioResults);
      setCurrentStep('audio_review');
      toast.success('Audio generated! Review each section.');
    } catch (error: any) {
      setCreationError({ message: error.message, step: 'audio' });
      setCurrentStep('error');
    }
  };

  // === STEP 4: CREATE IMAGE + SAVE (after audio approval) ===
  const handleFinalize = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('creating_image');
    const primaryLang = selectedLanguages[0];
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';
    const defaultVoice = voiceGender === 'female' ? '9BWtsMINqrJLrRacOk9x' : 'pNInz6obpgDQGcFmaJgB';
    const getVoiceForLang = (langCode: string) => voiceByLanguage[langCode] || defaultVoice;
    const sections = plannedSections;
    const scripts = generatedScripts;
    const BATCH_SIZE = 3;

    try {
      // Generate cover image
      setProgress({ step: 1, totalSteps: 3, message: 'Generating cover image...' });
      const { data: imgData } = await supabase.functions.invoke('generate-image', {
        body: {
          title: finalPlace, city: finalCity, country,
          category: category || 'Historical',
          prompt: `Award-winning travel photograph of ${finalPlace} in ${finalCity}, ${country}. Shot during golden hour with natural warm lighting. Composition: wide establishing shot showing the most iconic and recognizable view that tourists would see when approaching the site. Style: National Geographic cover quality, Canon EOS R5, 24-70mm f/2.8 lens. No people in the frame. No text, no watermarks, no logos, no overlays. Ultra sharp focus, rich natural colors, dramatic sky. Category: ${category || 'Historical'}.`
        }
      });
      setImageUrl(imgData?.image_url || null);

      // Build primary sections from approved audio
      const primarySections = sections.map((section, idx) => ({
        title: section.title,
        description: scripts[idx],
        audio_url: generatedAudio[idx]?.audio_url || '',
        duration_seconds: generatedAudio[idx]?.duration_seconds || section.estimated_minutes * 60,
        language: primaryLangName,
        language_code: primaryLang,
        order_index: idx
      }));

      // Generate translations + audio for other languages
      const additionalSections: typeof primarySections = [];
      const otherLangs = selectedLanguages.filter(l => l !== primaryLang);
      for (const langCode of otherLangs) {
        const langName = ELEVENLABS_LANGUAGES.find(l => l.code === langCode)?.name || langCode;
        for (let i = 0; i < sections.length; i += BATCH_SIZE) {
          const batch = sections.slice(i, Math.min(i + BATCH_SIZE, sections.length));
          setProgress({ step: 2, totalSteps: 3, message: `Translating to ${langName}...`, detail: `${Math.min(i + BATCH_SIZE, sections.length)}/${sections.length}` });
          const batchResults = await Promise.all(batch.map(async (_, batchIdx) => {
            const idx = i + batchIdx;
            const { data: transData } = await supabase.functions.invoke('translate-script', {
              body: { script: scripts[idx], source_language: primaryLangName, target_language: langName, place: finalPlace, section_title: sections[idx].title }
            });
            const translated = transData?.translated_script || scripts[idx];
            const audioData = await generateAudioWithRetry(translated, getVoiceForLang(langCode));
            return { title: sections[idx].title, description: translated, audio_url: audioData?.audio_url || '', duration_seconds: audioData?.duration_seconds || sections[idx].estimated_minutes * 60, language: langName, language_code: langCode, order_index: idx };
          }));
          additionalSections.push(...batchResults);
        }
      }

      // Save to database
      setProgress({ step: 3, totalSteps: 3, message: 'Saving guide...' });
      const allSections = [...primarySections, ...additionalSections];
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
          sections: allSections, is_published: false, is_featured: false
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
                      // Filter voices: prefer native speakers of this language, fallback to all
                      const langVoices = filteredVoices.filter(v => v.languages?.includes(langCode));
                      const voicesForLang = langVoices.length > 0 ? langVoices : filteredVoices;
                      return (
                        <div key={langCode} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-24 shrink-0 truncate">{langInfo?.flag} {langInfo?.name}</span>
                          <Select value={selectedVoice} onValueChange={(v) => setVoiceForLang(langCode, v)}>
                            <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue placeholder="Select voice..." /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {voicesForLang.map(v => (
                                <SelectItem key={v.voice_id} value={v.voice_id}>
                                  {v.name} {v.accent !== 'unknown' ? `(${v.accent})` : ''} {v.languages?.includes(langCode) ? '★' : ''}
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
              <Button onClick={handleStartAudioCreation} className="flex-1">
                Approve Scripts & Generate Audio
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

  // === RENDER: CREATING AUDIO ===
  if (currentStep === 'creating_audio') {
    const pct = Math.round((progress.step / progress.totalSteps) * 100);
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mic className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Generating Audio</h2>
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

  // === RENDER: AUDIO REVIEW ===
  if (currentStep === 'audio_review') {
    const totalDur = generatedAudio.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Review Audio — {generatedAudio.length} Sections ({Math.floor(totalDur / 60)} min)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Listen to each section. Regenerate any you don't like.</p>
            <div className="max-h-[500px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {generatedAudio.map((audio, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plannedSections[i]?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(audio.duration_seconds / 60)}:{String(Math.floor(audio.duration_seconds % 60)).padStart(2, '0')}
                      {!audio.audio_url && <span className="text-destructive ml-1">⚠ failed</span>}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => playSectionAudio(i)} disabled={!audio.audio_url}>
                    {playingSection === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" disabled={regeneratingAudio !== null} onClick={() => handleRegenerateAudio(i)}>
                    {regeneratingAudio === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleFinalize} className="flex-1">
                Approve Audio & Finalize Guide
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
              {creationError.step === 'creation' && generatedScripts.length > 0 && (
                <Button onClick={() => { setCreationError(null); handleStartCreation(); }}>
                  Retry Creation
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
