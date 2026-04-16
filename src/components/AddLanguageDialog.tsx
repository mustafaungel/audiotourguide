import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mergeAudioFiles } from '@/utils/audioMerge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Languages, Mic, Loader2, CheckCircle, Globe, Copy, Play, Pause } from 'lucide-react';
import { ELEVENLABS_LANGUAGES } from '@/data/countries-full';
import { toast } from 'sonner';

interface AddLanguageDialogProps {
  open: boolean;
  onClose: () => void;
  guideId: string;
  guideTitle: string;
  guideLocation: string;
}

type Step = 'select' | 'translating' | 'upload' | 'saving' | 'done';

export function AddLanguageDialog({ open, onClose, guideId, guideTitle, guideLocation }: AddLanguageDialogProps) {
  const [existingLanguages, setExistingLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  // Translation results
  const [translatedSections, setTranslatedSections] = useState<{ title: string; description: string; original: any }[]>([]);
  // Audio upload
  const [uploadedAudio, setUploadedAudio] = useState<{ audio_url: string; duration_seconds: number }[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const availableLanguages = ELEVENLABS_LANGUAGES.filter(l => !existingLanguages.includes(l.code));
  const selectedLangName = ELEVENLABS_LANGUAGES.find(l => l.code === selectedLang)?.name || '';

  // Reset on open
  useEffect(() => {
    if (!open || !guideId) return;
    setStep('select');
    setSelectedLang('');
    setTranslatedSections([]);
    setUploadedAudio([]);

    (async () => {
      const { data } = await supabase.rpc('get_guide_languages', { p_guide_id: guideId });
      if (data) setExistingLanguages(data.map((l: any) => l.language_code));
    })();
  }, [open, guideId]);

  // === TRANSLATE ALL SCRIPTS ===
  const handleTranslate = async () => {
    if (!selectedLang) return;
    setStep('translating');

    try {
      // Fetch English source sections
      const { data: origSections, error: fetchErr } = await supabase
        .from('guide_sections')
        .select('id, title, description, order_index, duration_seconds')
        .eq('guide_id', guideId)
        .eq('language_code', 'en')
        .order('order_index');

      if (fetchErr || !origSections?.length) throw new Error('No English sections found to translate from');

      const validSections = origSections.filter(s => s.description && s.description.length > 50);
      const total = validSections.length;
      setProgress({ current: 0, total: total * 2, message: 'Starting translation...' });

      const cleanMarkers = (text: string) =>
        text.replace(/^---\s*/gm, '').replace(/\s*---$/gm, '').replace(/^"""\s*/gm, '').replace(/\s*"""$/gm, '').trim();

      const results: { title: string; description: string; original: any }[] = [];

      for (let i = 0; i < total; i++) {
        const orig = validSections[i];

        // Translate title
        setProgress({ current: i * 2, total: total * 2, message: `Translating ${i + 1}/${total}: ${orig.title.substring(0, 30)}...` });
        const { data: titleTrans } = await supabase.functions.invoke('translate-script', {
          body: { script: orig.title, source_language: 'English', target_language: selectedLangName, place: guideTitle, section_title: orig.title }
        });
        const rawTitle = cleanMarkers(titleTrans?.translated_script || orig.title);
        const translatedTitle = rawTitle.split('\n')[0].trim();

        // Translate description
        setProgress({ current: i * 2 + 1, total: total * 2, message: `Translating script ${i + 1}/${total}...` });
        const { data: descTrans } = await supabase.functions.invoke('translate-script', {
          body: { script: orig.description, source_language: 'English', target_language: selectedLangName, place: guideTitle, section_title: orig.title }
        });
        const translatedDesc = cleanMarkers(descTrans?.translated_script || orig.description);

        results.push({ title: translatedTitle, description: translatedDesc, original: orig });
      }

      setTranslatedSections(results);
      setUploadedAudio(results.map(() => ({ audio_url: '', duration_seconds: 0 })));
      setStep('upload');
      toast.success(`${total} sections translated to ${selectedLangName}!`);
    } catch (error: any) {
      toast.error(`Translation failed: ${error.message}`);
      setStep('select');
    }
  };

  // === AUDIO HELPERS ===
  const handleCopyScript = async (index: number) => {
    try {
      await navigator.clipboard.writeText(translatedSections[index].description);
      setCopiedIdx(index);
      toast.success('Script copied! Paste it in ElevenLabs');
      setTimeout(() => setCopiedIdx(null), 3000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleAudioUpload = async (index: number, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploadingIdx(index);
    try {
      const { blob, duration } = await mergeAudioFiles(fileArray);
      console.log('Upload:', { files: fileArray.length, blobSize: blob.size, blobType: blob.type, duration });
      const path = `uploaded-${Date.now()}-${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage.from('guide-audio').upload(path, blob, {
        contentType: 'audio/mpeg',
        upsert: false,
      });
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(uploadError.message || 'Storage upload failed');
      }
      const { data: urlData } = supabase.storage.from('guide-audio').getPublicUrl(path);
      setUploadedAudio(prev => prev.map((a, i) => i === index ? { audio_url: urlData.publicUrl, duration_seconds: duration } : a));
      toast.success(fileArray.length > 1
        ? `${fileArray.length} files merged & uploaded for section ${index + 1}`
        : `Audio uploaded for section ${index + 1}`);
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    setUploadingIdx(null);
  };

  const handleRemoveAudio = (index: number) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingIdx(null);
    setUploadedAudio(prev => prev.map((a, i) => i === index ? { audio_url: '', duration_seconds: 0 } : a));
  };

  const playAudio = (index: number) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingIdx === index) { setPlayingIdx(null); return; }
    const url = uploadedAudio[index]?.audio_url;
    if (!url) return;
    const audio = new Audio(url);
    audio.onended = () => { setPlayingIdx(null); audioRef.current = null; };
    audio.play();
    setPlayingIdx(index);
    audioRef.current = audio;
  };

  // === SAVE TO DATABASE ===
  const handleSave = async () => {
    setStep('saving');
    setProgress({ current: 0, total: 2, message: 'Saving sections...' });

    try {
      const newSections = translatedSections.map((section, i) => ({
        guide_id: guideId,
        title: section.title,
        description: section.description,
        audio_url: uploadedAudio[i]?.audio_url || null,
        duration_seconds: uploadedAudio[i]?.duration_seconds || section.original.duration_seconds || 180,
        language: selectedLangName,
        language_code: selectedLang,
        order_index: section.original.order_index,
        is_original: false,
        original_section_id: section.original.id,
      }));

      const { error: insertErr } = await supabase.from('guide_sections').insert(newSections);
      if (insertErr) throw new Error(`Failed to save: ${insertErr.message}`);

      // Update guide languages array
      setProgress({ current: 1, total: 2, message: 'Updating guide...' });
      const { data: guide } = await supabase.from('audio_guides').select('languages').eq('id', guideId).single();
      const currentLangs: string[] = guide?.languages || [];
      if (!currentLangs.includes(selectedLangName)) {
        await supabase.from('audio_guides').update({ languages: [...currentLangs, selectedLangName] }).eq('id', guideId);
      }

      setStep('done');
      toast.success(`${selectedLangName} added with ${newSections.length} sections!`);
    } catch (error: any) {
      toast.error(`Save failed: ${error.message}`);
      setStep('upload');
    }
  };

  const uploadedCount = uploadedAudio.filter(a => a?.audio_url).length;
  const allUploaded = translatedSections.length > 0 && uploadedCount >= translatedSections.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={step === 'upload' ? 'max-w-2xl max-h-[85vh] overflow-hidden flex flex-col' : 'max-w-lg'}>
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

            <Button onClick={handleTranslate} disabled={!selectedLang} className="w-full">
              Translate Scripts to {selectedLangName || '...'}
            </Button>
          </div>
        )}

        {/* TRANSLATING STEP */}
        {step === 'translating' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium">{progress.message}</p>
              <p className="text-xs text-muted-foreground mt-1">Translating to {selectedLangName} for {guideTitle}</p>
            </div>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-2" />
          </div>
        )}

        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground space-y-1 shrink-0">
              <p><strong>Workflow:</strong> Copy each translated script, paste into <a href="https://elevenlabs.io/app/speech-synthesis" target="_blank" rel="noopener noreferrer" className="text-primary underline">ElevenLabs</a>, generate audio, then upload the MP3 here.</p>
              <p className="text-xs">{uploadedCount}/{translatedSections.length} sections uploaded</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {translatedSections.map((section, i) => {
                const hasAudio = uploadedAudio[i]?.audio_url;
                const dur = uploadedAudio[i]?.duration_seconds || 0;
                const words = section.description.split(/\s+/).length;

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
                        className={`shrink-0 gap-1 text-xs ${copiedIdx === i ? 'text-green-600 border-green-500' : ''}`}
                        onClick={() => handleCopyScript(i)}
                      >
                        {copiedIdx === i ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === i ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    {hasAudio ? (
                      <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => playAudio(i)}>
                          {playingIdx === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-600">Audio uploaded</p>
                          <p className="text-[10px] text-muted-foreground">{Math.floor(dur / 60)}:{String(Math.floor(dur % 60)).padStart(2, '0')}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive text-xs shrink-0" onClick={() => handleRemoveAudio(i)}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingIdx === i ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30'}`}>
                        {uploadingIdx === i ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm text-primary">Uploading...</span></>
                        ) : (
                          <><Mic className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload MP3 (multiple auto-merged)</span></>
                        )}
                        <input
                          type="file"
                          accept="audio/*"
                          multiple
                          className="hidden"
                          disabled={uploadingIdx !== null}
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

            <div className="flex gap-2 pt-2 shrink-0">
              <Button onClick={handleSave} className="flex-1" disabled={!allUploaded}>
                {allUploaded ? 'Save & Add Language' : `Upload ${translatedSections.length - uploadedCount} more audio files`}
              </Button>
              <Button variant="outline" onClick={() => { setStep('select'); setTranslatedSections([]); setUploadedAudio([]); }}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* SAVING STEP */}
        {step === 'saving' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-sm font-medium">{progress.message}</p>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-2" />
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-bold">{selectedLangName} Added!</h3>
              <p className="text-sm text-muted-foreground">All sections translated and audio uploaded.</p>
            </div>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
