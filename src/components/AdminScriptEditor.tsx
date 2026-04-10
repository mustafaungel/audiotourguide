import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Section {
  id: string;
  title: string;
  description: string;
  order_index: number;
  language_code: string;
  duration_seconds: number | null;
}

interface AdminScriptEditorProps {
  open: boolean;
  onClose: () => void;
  guideId: string;
  guideTitle: string;
}

const MAX_CHARS = 4000;

export function AdminScriptEditor({ open, onClose, guideId, guideTitle }: AdminScriptEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editedSections, setEditedSections] = useState<Record<string, { title?: string; description?: string }>>({});

  // Load sections when dialog opens
  useEffect(() => {
    if (!open || !guideId) return;
    loadLanguages();
    loadSections('en');
    setExpandedId(null);
    setEditedSections({});
  }, [open, guideId]);

  const loadLanguages = async () => {
    const { data } = await supabase.rpc('get_guide_languages', { p_guide_id: guideId });
    if (data) {
      const codes = data.map((l: any) => l.language_code);
      setLanguages(codes);
      if (codes.length > 0 && !codes.includes(selectedLang)) {
        setSelectedLang(codes[0]);
      }
    }
  };

  const loadSections = async (langCode: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('guide_sections')
      .select('id, title, description, order_index, language_code, duration_seconds')
      .eq('guide_id', guideId)
      .eq('language_code', langCode)
      .order('order_index');

    if (!error && data) {
      setSections(data);
      // Auto-expand first section with issues
      const problemSection = data.find(s => (s.description?.length || 0) > MAX_CHARS);
      if (problemSection) setExpandedId(problemSection.id);
    }
    setLoading(false);
  };

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    setEditedSections({});
    setExpandedId(null);
    loadSections(lang);
  };

  const handleFieldChange = (sectionId: string, field: 'title' | 'description', value: string) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [field]: value }
    }));
  };

  const handleSave = async (sectionId: string) => {
    const edits = editedSections[sectionId];
    if (!edits) return;

    setSavingId(sectionId);
    const updates: any = {};
    if (edits.title !== undefined) updates.title = edits.title;
    if (edits.description !== undefined) updates.description = edits.description;

    const { error } = await supabase
      .from('guide_sections')
      .update(updates)
      .eq('id', sectionId);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      toast.success('Section saved');
      // Update local state
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ));
      // Clear edits for this section
      setEditedSections(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    }
    setSavingId(null);
  };

  const getDisplayValue = (section: Section, field: 'title' | 'description') => {
    return editedSections[section.id]?.[field] ?? section[field] ?? '';
  };

  const getCharCount = (section: Section) => {
    const desc = getDisplayValue(section, 'description');
    return desc.length;
  };

  const hasEdits = (sectionId: string) => !!editedSections[sectionId];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Script Editor — {guideTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Language selector + section count */}
        <div className="flex items-center gap-3 pb-2">
          <Select value={selectedLang} onValueChange={handleLangChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(code => (
                <SelectItem key={code} value={code}>
                  {code.toUpperCase()} — {sections.length > 0 ? `${sections.length} sections` : '...'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {sections.length} sections
          </span>
        </div>

        {/* Sections list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sections.map((section, i) => {
            const isExpanded = expandedId === section.id;
            const chars = getCharCount(section);
            const isLong = chars > MAX_CHARS;
            const estMin = Math.ceil(chars / 900); // ~150 words/min, ~6 chars/word
            const edited = hasEdits(section.id);

            return (
              <div key={section.id} className="border rounded-lg overflow-hidden">
                {/* Section header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <span className="text-sm font-medium flex-1 truncate">
                    {getDisplayValue(section, 'title')}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {isLong ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        {chars}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{chars} chars</span>
                    )}
                    {edited && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500">edited</Badge>}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t bg-muted/20">
                    {/* Title */}
                    <div className="pt-3">
                      <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                      <Input
                        value={getDisplayValue(section, 'title')}
                        onChange={(e) => handleFieldChange(section.id, 'title', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Script textarea */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Script</Label>
                      <textarea
                        value={getDisplayValue(section, 'description')}
                        onChange={(e) => handleFieldChange(section.id, 'description', e.target.value)}
                        className="mt-1 w-full min-h-[200px] max-h-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Enter narration script..."
                      />
                    </div>

                    {/* Stats + Save */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className={isLong ? 'text-destructive font-bold' : ''}>
                          {chars} characters
                        </span>
                        <span>~{estMin} min</span>
                        {isLong && (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Too long — may cause issues with TTS
                          </span>
                        )}
                        {!isLong && chars > 0 && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={!edited || savingId === section.id}
                        onClick={() => handleSave(section.id)}
                      >
                        {savingId === section.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
