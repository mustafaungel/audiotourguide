import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Plus, Trash2, Sparkles, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { ELEVENLABS_LANGUAGES, GUIDE_CATEGORIES } from '@/data/countries-full';
import { toast } from 'sonner';

interface Section {
  title: string;
  script: string;
}

type Step = 'form' | 'sections' | 'saving' | 'done';

export function ManualGuideCreator() {
  const [step, setStep] = useState<Step>('form');

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [langCode, setLangCode] = useState('en');
  const [price, setPrice] = useState('499');

  // Sections state
  const [sections, setSections] = useState<Section[]>([{ title: '', script: '' }]);
  const [polishingIdx, setPolishingIdx] = useState<number | null>(null);

  // Result
  const [result, setResult] = useState<{ guideId: string; shareUrl: string } | null>(null);

  const langName = ELEVENLABS_LANGUAGES.find(l => l.code === langCode)?.name || 'English';
  const isFormValid = title.trim() && location.trim() && category;
  const hasSections = sections.some(s => s.title.trim() && s.script.trim().length > 20);
  const totalWords = sections.reduce((sum, s) => sum + s.script.split(/\s+/).filter(Boolean).length, 0);
  const totalMinutes = Math.round(totalWords / 150);

  const addSection = () => setSections(prev => [...prev, { title: '', script: '' }]);

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSection = (idx: number, field: 'title' | 'script', value: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // Polish script with AI
  const handlePolish = async (idx: number) => {
    const script = sections[idx].script;
    if (!script || script.length < 20) { toast.error('Script too short to polish'); return; }

    setPolishingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('polish-script', {
        body: { script, language: langName, place: title }
      });
      if (error || !data?.polished_script) {
        toast.error(`Polish failed: ${error?.message || 'No response'}`);
        return;
      }
      updateSection(idx, 'script', data.polished_script);
      toast.success('Script polished!');
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
    setPolishingIdx(null);
  };

  // Save as draft
  const handleSave = async () => {
    const validSections = sections.filter(s => s.title.trim() && s.script.trim().length > 10);
    if (validSections.length === 0) { toast.error('Add at least one section with title and script'); return; }

    setStep('saving');
    try {
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: {
          title: title.trim(),
          description: `Explore ${title.trim()} in ${location.trim()}. Professional audio tour guide with ${validSections.length} stops.`,
          location: location.trim(),
          category,
          duration: Math.max(1, totalMinutes),
          difficulty: 'Easy',
          languages: [langName],
          price_usd: parseInt(price) || 499,
          sections: validSections.map((s, i) => ({
            title: s.title.trim(),
            description: s.script.trim(),
            audio_url: null,
            duration_seconds: Math.round(s.script.split(/\s+/).filter(Boolean).length / 150 * 60),
            language: langName,
            language_code: langCode,
            order_index: i,
          })),
          is_published: false,
          is_featured: false,
        }
      });

      if (error || !data?.guide) throw new Error(error?.message || 'Failed to create guide');
      setResult({ guideId: data.guide.id, shareUrl: data.guide.share_url || '' });
      setStep('done');
      toast.success('Guide saved as draft!');
    } catch (e: any) {
      toast.error(`Save failed: ${e.message}`);
      setStep('sections');
    }
  };

  // === STEP 1: FORM ===
  if (step === 'form') {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Manual Audio Guide Creator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Create a guide by entering scripts manually. Audio files can be uploaded later.</p>

            <div className="space-y-2">
              <Label>Guide Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hagia Sophia Audio Guide" />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Istanbul, Turkey" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {GUIDE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={langCode} onValueChange={setLangCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {ELEVENLABS_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price (USD cents)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="499" />
              <p className="text-xs text-muted-foreground">${(parseInt(price) / 100 || 0).toFixed(2)} USD</p>
            </div>

            <Button onClick={() => setStep('sections')} disabled={!isFormValid} className="w-full">
              Next: Add Sections <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === STEP 2: SECTIONS ===
  if (step === 'sections') {
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sections — {title}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {sections.filter(s => s.script.length > 10).length} sections · {totalWords} words · ~{totalMinutes} min
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{location} · {langName} · Add sections with title and narration script</p>

            <div className="max-h-[550px] overflow-y-auto space-y-3 border rounded-lg p-3">
              {sections.map((section, i) => {
                const words = section.script.split(/\s+/).filter(Boolean).length;
                return (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                      <Input
                        value={section.title}
                        onChange={e => updateSection(i, 'title', e.target.value)}
                        placeholder="Section title..."
                        className="flex-1 font-medium"
                      />
                      {sections.length > 1 && (
                        <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => removeSection(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <textarea
                      value={section.script}
                      onChange={e => updateSection(i, 'script', e.target.value)}
                      placeholder="Paste or type the narration script for this section..."
                      className="w-full min-h-[120px] max-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{words} words · ~{Math.max(1, Math.round(words / 150))} min</span>
                      <Button
                        size="sm" variant="outline" className="gap-1 text-xs"
                        disabled={polishingIdx !== null || section.script.length < 20}
                        onClick={() => handlePolish(i)}
                      >
                        {polishingIdx === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {polishingIdx === i ? 'Polishing...' : 'Polish'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" onClick={addSection} className="w-full gap-1">
              <Plus className="w-4 h-4" /> Add Section
            </Button>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('form')}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSave} disabled={!hasSections} className="flex-1">
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === SAVING ===
  if (step === 'saving') {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-sm font-medium">Saving guide as draft...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === DONE ===
  if (step === 'done' && result) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-5">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sections.filter(s => s.script.length > 10).length} sections · {location} · Saved as Draft
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-medium">Next steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Content Management → find this guide</li>
                <li>Edit → upload audio files per section</li>
                <li>Publish when ready</li>
              </ol>
            </div>
            <Button onClick={() => { setStep('form'); setTitle(''); setLocation(''); setCategory(''); setSections([{ title: '', script: '' }]); setResult(null); }} className="w-full">
              Create Another Guide
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
