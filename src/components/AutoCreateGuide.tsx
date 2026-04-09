import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, MapPin, Landmark, Languages, DollarSign, Mic, Loader2, CheckCircle, Music, Image, Save, Copy } from 'lucide-react';
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

type Step = 'form' | 'creating' | 'done';

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
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(l => l !== langCode);
      }
      return [...prev, langCode];
    });
  }, []);

  // Form validation
  const isFormValid = country && (city || cityInput) && (place || placeInput) && selectedLanguages.length > 0;

  // === MAIN CREATION FLOW ===
  const handleCreate = async () => {
    const finalCity = city || cityInput;
    const finalPlace = place || placeInput;
    if (!country || !finalCity || !finalPlace) return;

    setCurrentStep('creating');
    const voiceId = voiceGender === 'female' ? '9BWtsMINqrJLrRacOk9x' : 'pNInz6obpgDQGcFmaJgB';
    const primaryLang = selectedLanguages[0];
    const primaryLangName = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLang)?.name || 'English';

    try {
      // Step 1: Plan sections
      setProgress({ step: 1, totalSteps: 6, message: 'Researching location and planning sections...' });
      const { data: planData, error: planError } = await supabase.functions.invoke('plan-guide-sections', {
        body: { country, city: finalCity, place: finalPlace, place_type: '', category: category || 'Historical' }
      });
      if (planError || !planData?.sections) throw new Error('Failed to plan sections');
      const sections: PlannedSection[] = planData.sections;

      // Step 2: Generate scripts for each section
      const scripts: string[] = [];
      for (let i = 0; i < sections.length; i++) {
        setProgress({
          step: 2, totalSteps: 6,
          message: `Writing narration scripts...`,
          detail: `${i + 1}/${sections.length} sections complete`
        });
        const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-section-script', {
          body: {
            country, city: finalCity, place: finalPlace,
            section: sections[i],
            previous_ending: i > 0 ? scripts[i - 1]?.slice(-200) : null,
            next_title: i < sections.length - 1 ? sections[i + 1].title : null,
            language: primaryLangName
          }
        });
        if (scriptError || !scriptData?.script) throw new Error(`Failed to generate script for section ${i + 1}`);
        scripts.push(scriptData.script);
      }

      // Step 3: Generate cover image
      setProgress({ step: 3, totalSteps: 6, message: 'Generating cover image...' });
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: `Ultra-realistic professional travel photography of ${finalPlace} in ${finalCity}, ${country}. Golden hour lighting, National Geographic quality, showcasing the most iconic and breathtaking view. Vibrant colors, sharp focus, cinematic composition. No text, no watermarks.`,
          location: `${finalCity}, ${country}`
        }
      });
      const imageUrl = imageData?.image_url || null;

      // Step 4: Generate audio for primary language
      const primarySections: { title: string; description: string; audio_url: string; duration_seconds: number; language: string; language_code: string; order_index: number }[] = [];
      for (let i = 0; i < sections.length; i++) {
        setProgress({
          step: 4, totalSteps: 6,
          message: `Producing audio files...`,
          detail: `${primaryLangName}: ${i + 1}/${sections.length}`
        });
        const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
          body: { text: scripts[i], voiceId, modelId: 'eleven_multilingual_v2' }
        });
        if (audioError || !audioData?.audio_url) throw new Error(`Failed to generate audio for section ${i + 1}`);
        primarySections.push({
          title: sections[i].title,
          description: scripts[i].substring(0, 200) + '...',
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
            step: 5, totalSteps: 6,
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
            body: { text: translatedScript, voiceId, modelId: 'eleven_multilingual_v2' }
          });
          additionalSections.push({
            title: sections[i].title,
            description: translatedScript.substring(0, 200) + '...',
            audio_url: audioData?.audio_url || '',
            duration_seconds: audioData?.duration_seconds || sections[i].estimated_minutes * 60,
            language: langName,
            language_code: langCode,
            order_index: i
          });
        }
      }

      // Step 6: Create guide in database
      setProgress({ step: 6, totalSteps: 6, message: 'Saving guide...' });
      const allSections = [...primarySections, ...additionalSections];
      const totalDuration = primarySections.reduce((sum, s) => sum + s.duration_seconds, 0);

      const { data: guideData, error: guideError } = await supabase.functions.invoke('create-guide', {
        body: {
          title: `${finalCity} : ${finalPlace}`,
          description: `Explore ${finalPlace} in ${finalCity}, ${country}`,
          location: `${finalCity}, ${country}`,
          category: category || 'Historical',
          duration: Math.ceil(totalDuration / 60),
          difficulty: 'Easy',
          languages: selectedLanguages.map(c => ELEVENLABS_LANGUAGES.find(l => l.code === c)?.name || c),
          price_usd: parseInt(priceUsd) || 499,
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
      setCurrentStep('done');
      toast.success('Guide created successfully!');

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

            {/* Voice Gender */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Voice</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setVoiceGender('female')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                    voiceGender === 'female'
                      ? 'bg-primary/15 border-primary text-primary ring-2 ring-primary/30'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Female (Aria)
                </button>
                <button
                  onClick={() => setVoiceGender('male')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                    voiceGender === 'male'
                      ? 'bg-primary/15 border-primary text-primary ring-2 ring-primary/30'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Male (Adam)
                </button>
              </div>
            </div>

            {/* Languages */}
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

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={!isFormValid}
              className="w-full h-12 text-base"
            >
              Create Guide
            </Button>
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

  // === RENDER: DONE ===
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Guide Created Successfully!</h2>
            <p className="text-muted-foreground text-sm">{place || placeInput} — {city || cityInput}, {country}</p>
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
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => window.open(result.shareUrl, '_blank')}>
                  Open Guide
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setCurrentStep('form'); setResult(null); }}>
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
