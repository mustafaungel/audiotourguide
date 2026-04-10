import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Languages, Mic, Loader2, CheckCircle, Globe } from 'lucide-react';
import { ELEVENLABS_LANGUAGES } from '@/data/countries-full';
import { toast } from 'sonner';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  accent: string;
  preview_url: string | null;
}

interface AddLanguageDialogProps {
  open: boolean;
  onClose: () => void;
  guideId: string;
  guideTitle: string;
  guideLocation: string;
}

type Step = 'select' | 'working' | 'done';

export function AddLanguageDialog({ open, onClose, guideId, guideTitle, guideLocation }: AddLanguageDialogProps) {
  const [existingLanguages, setExistingLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  // Cache translated preview text per language (avoid re-translating on voice change)
  const translatedPreviewRef = useRef<Record<string, string>>({});

  // Load existing languages and voices on open
  useEffect(() => {
    if (!open || !guideId) return;
    setStep('select');
    setSelectedLang('');
    setSelectedVoiceId('');

    // Fetch existing languages
    (async () => {
      const { data } = await supabase.rpc('get_guide_languages', { p_guide_id: guideId });
      if (data) setExistingLanguages(data.map((l: any) => l.language_code));
    })();

    // Voices fetched when language is selected (below)
  }, [open, guideId]);

  // Fetch voices filtered by selected language
  useEffect(() => {
    if (!selectedLang) return;
    const langName = ELEVENLABS_LANGUAGES.find(l => l.code === selectedLang)?.name;
    (async () => {
      setLoadingVoices(true);
      setSelectedVoiceId('');
      try {
        const { data } = await supabase.functions.invoke('list-voices', {
          body: { language: langName || selectedLang }
        });
        if (data?.voices) setVoices(data.voices);
      } catch { /* silent */ }
      finally { setLoadingVoices(false); }
    })();
  }, [selectedLang]);

  const filteredVoices = voices.filter(v => v.gender === voiceGender);
  const availableLanguages = ELEVENLABS_LANGUAGES.filter(l => !existingLanguages.includes(l.code));
  const selectedLangName = ELEVENLABS_LANGUAGES.find(l => l.code === selectedLang)?.name || '';

  // Preview sentences per language
  const PREVIEW: Record<string, string> = {
    en: 'Welcome to this audio tour guide.',
    es: 'Bienvenidos a esta guía de audio.',
    fr: 'Bienvenue dans ce guide audio.',
    de: 'Willkommen zu diesem Audio-Reiseführer.',
    it: 'Benvenuti in questa guida audio.',
    pt: 'Bem-vindos a este guia de áudio.',
    tr: 'Bu sesli tura hoş geldiniz.',
    ja: 'このオーディオツアーへようこそ。',
    ko: '이 오디오 투어에 오신 것을 환영합니다.',
    zh: '欢迎来到这次语音导览。',
    ru: 'Добро пожаловать в этот аудиотур.',
    ar: 'مرحبًا بكم في هذه الجولة الصوتية.',
  };

  const handlePreview = useCallback(async () => {
    if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); }
    if (playingPreview) { setPlayingPreview(false); return; }
    if (!selectedVoiceId || !selectedLang) return;

    setGeneratingPreview(true);
    try {
      // Check cache first - avoid re-translating for same language
      let previewText = translatedPreviewRef.current[selectedLang];

      if (!previewText) {
        // First preview for this language - translate once
        const { data: sections } = await supabase.from('guide_sections')
          .select('description')
          .eq('guide_id', guideId)
          .eq('language_code', 'en')
          .order('order_index')
          .limit(1);

        if (sections?.[0]?.description && sections[0].description.length > 100) {
          const snippet = sections[0].description.substring(0, 300);
          const { data: transData } = await supabase.functions.invoke('translate-script', {
            body: { script: snippet, source_language: 'English', target_language: selectedLangName, place: guideTitle }
          });
          previewText = transData?.translated_script?.replace(/^---\s*/gm, '').replace(/\s*---$/gm, '').trim() || '';
        }
        if (!previewText) previewText = PREVIEW[selectedLang] || PREVIEW.en;
        // Cache for next voice change
        translatedPreviewRef.current[selectedLang] = previewText;
      }

      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text: previewText, voiceId: selectedVoiceId, modelId: 'eleven_multilingual_v2', isPreview: true }
      });
      if (error || !data?.audio_url) {
        toast.error(`Preview failed: ${error?.message || data?.error || 'No audio URL'}`);
        return;
      }
      const audio = new Audio(data.audio_url);
      audio.onended = () => { setPlayingPreview(false); setPreviewAudio(null); };
      audio.onerror = () => { toast.error('Audio playback failed'); setPlayingPreview(false); };
      await audio.play();
      setPlayingPreview(true);
      setPreviewAudio(audio);
    } catch (e: any) { toast.error(`Preview error: ${e?.message || 'Unknown'}`); }
    finally { setGeneratingPreview(false); }
  }, [selectedVoiceId, selectedLang, previewAudio, playingPreview]);

  // Start translation + audio generation
  const handleStart = async () => {
    if (!selectedLang || !selectedVoiceId) return;

    setStep('working');

    try {
      // 1. Fetch English sections as source for translation
      const { data: origSections, error: fetchErr } = await supabase
        .from('guide_sections')
        .select('id, title, description, order_index, duration_seconds')
        .eq('guide_id', guideId)
        .eq('language_code', 'en')
        .order('order_index');

      if (fetchErr || !origSections?.length) {
        throw new Error('No English sections found to translate from');
      }

      // Filter out sections with empty descriptions (no script to translate)
      const validSections = origSections!.filter(s => s.description && s.description.length > 50);
      const total = validSections.length;
      setProgress({ current: 0, total: total * 3, message: 'Starting...' });

      // Clean --- markers from translated text
      const cleanMarkers = (text: string) => text.replace(/^---\s*/gm, '').replace(/\s*---$/gm, '').replace(/^"""\s*/gm, '').replace(/\s*"""$/gm, '').trim();

      const newSections: any[] = [];

      for (let i = 0; i < total; i++) {
        const orig = validSections[i];

        // Step 1: Translate title
        setProgress({ current: i * 3, total: total * 3, message: `Translating section ${i + 1}/${total}...` });
        const { data: titleTrans } = await supabase.functions.invoke('translate-script', {
          body: { script: orig.title, source_language: 'English', target_language: selectedLangName, place: guideTitle, section_title: orig.title }
        });
        // Keep only first line of title (GPT sometimes adds full paragraphs)
        const rawTitle = cleanMarkers(titleTrans?.translated_script || orig.title);
        const translatedTitle = rawTitle.split('\n')[0].trim();

        // Step 2: Translate description/script
        setProgress({ current: i * 3 + 1, total: total * 3, message: `Translating script ${i + 1}/${total}...` });
        const { data: descTrans } = await supabase.functions.invoke('translate-script', {
          body: { script: orig.description, source_language: 'English', target_language: selectedLangName, place: guideTitle, section_title: orig.title }
        });
        const translatedDesc = cleanMarkers(descTrans?.translated_script || orig.description);

        // Step 3: Generate audio
        setProgress({ current: i * 3 + 2, total: total * 3, message: `Generating audio ${i + 1}/${total}...` });
        const audioText = translatedDesc;
        const { data: audioData } = await supabase.functions.invoke('generate-audio', {
          body: { text: audioText, voiceId: selectedVoiceId, modelId: 'eleven_multilingual_v2' }
        });

        newSections.push({
          guide_id: guideId,
          title: translatedTitle,
          description: translatedDesc,
          audio_url: audioData?.audio_url || null,
          duration_seconds: audioData?.duration_seconds || orig.duration_seconds || 180,
          language: selectedLangName,
          language_code: selectedLang,
          order_index: orig.order_index,
          is_original: false,
          original_section_id: orig.id,
        });
      }

      // Save all translated sections to DB
      setProgress({ current: total * 3, total: total * 3, message: 'Saving sections...' });
      const { error: insertErr } = await supabase.from('guide_sections').insert(newSections);
      if (insertErr) throw new Error(`Failed to save: ${insertErr.message}`);

      // Update guide languages array
      const { data: guide } = await supabase.from('audio_guides').select('languages').eq('id', guideId).single();
      const currentLangs: string[] = guide?.languages || [];
      if (!currentLangs.includes(selectedLangName)) {
        await supabase.from('audio_guides').update({ languages: [...currentLangs, selectedLangName] }).eq('id', guideId);
      }

      setStep('done');
      toast.success(`${selectedLangName} language added with ${total} sections!`);

    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
      setStep('select');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Add Language — {guideTitle}
          </DialogTitle>
        </DialogHeader>

        {/* SELECT STEP */}
        {step === 'select' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{guideLocation}</p>

            {/* Existing languages */}
            {existingLanguages.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Existing Languages</Label>
                <div className="flex flex-wrap gap-1.5">
                  {existingLanguages.map(code => {
                    const lang = ELEVENLABS_LANGUAGES.find(l => l.code === code);
                    return <Badge key={code} variant="secondary" className="text-xs">{lang?.flag} {lang?.name || code}</Badge>;
                  })}
                </div>
              </div>
            )}

            {/* Language selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> New Language</Label>
              {availableLanguages.length === 0 ? (
                <p className="text-sm text-muted-foreground">All supported languages are already added.</p>
              ) : (
                <Select value={selectedLang} onValueChange={setSelectedLang}>
                  <SelectTrigger><SelectValue placeholder="Select language to add..." /></SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {availableLanguages.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Voice selection */}
            {selectedLang && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Voice for {selectedLangName}</Label>
                <div className="flex gap-2 mb-1">
                  <button onClick={() => setVoiceGender('female')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${voiceGender === 'female' ? 'bg-primary/15 border-primary text-primary' : 'border-border hover:bg-muted'}`}>
                    Female
                  </button>
                  <button onClick={() => setVoiceGender('male')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${voiceGender === 'male' ? 'bg-primary/15 border-primary text-primary' : 'border-border hover:bg-muted'}`}>
                    Male
                  </button>
                </div>
                {loadingVoices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select voice..." /></SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {filteredVoices.map(v => (
                          <SelectItem key={v.voice_id} value={v.voice_id}>
                            {v.name} {v.accent !== 'unknown' ? `(${v.accent})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVoiceId && (
                      <Button variant="outline" size="sm" disabled={generatingPreview} onClick={handlePreview}>
                        {generatingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : playingPreview ? '⏹' : '▶'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Start button */}
            <Button onClick={handleStart} disabled={!selectedLang || !selectedVoiceId} className="w-full">
              Translate & Generate Audio
            </Button>
          </div>
        )}

        {/* WORKING STEP */}
        {step === 'working' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium">{progress.message}</p>
              <p className="text-xs text-muted-foreground mt-1">Adding {selectedLangName} to {guideTitle}</p>
            </div>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-2" />
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-bold">{selectedLangName} Added!</h3>
              <p className="text-sm text-muted-foreground">All sections translated and audio generated.</p>
            </div>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
