import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2, Play, Pause, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { AudioGuideLoader } from './AudioGuideLoader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GuideSection {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  language: string;
  order_index: number;
}

interface GuideSectionsManagerProps {
  guideId: string;
}

export const GuideSectionsManager = ({ guideId }: GuideSectionsManagerProps) => {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, [guideId]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('guide_id', guideId)
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load guide sections');
    } finally {
      setLoading(false);
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    setSaving(true);
    try {
      const newOrderIndex = sections.length;
      const { data, error } = await supabase
        .from('guide_sections')
        .insert({
          guide_id: guideId,
          title: newSectionTitle,
          language: 'English',
          order_index: newOrderIndex
        })
        .select()
        .single();

      if (error) throw error;

      setSections(prev => [...prev, data]);
      setNewSectionTitle('');
      toast.success('Section added successfully');
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<GuideSection>) => {
    try {
      const { error } = await supabase
        .from('guide_sections')
        .update(updates)
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      ));
      
      toast.success('Section updated');
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Failed to update section');
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('guide_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.filter(section => section.id !== sectionId));
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === sections.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedSections = [...sections];
    [updatedSections[currentIndex], updatedSections[newIndex]] = 
    [updatedSections[newIndex], updatedSections[currentIndex]];

    // Update order_index for both sections
    try {
      await Promise.all([
        supabase
          .from('guide_sections')
          .update({ order_index: newIndex })
          .eq('id', updatedSections[newIndex].id),
        supabase
          .from('guide_sections')
          .update({ order_index: currentIndex })
          .eq('id', updatedSections[currentIndex].id)
      ]);

      setSections(updatedSections);
      toast.success('Section moved');
    } catch (error) {
      console.error('Error moving section:', error);
      toast.error('Failed to move section');
    }
  };

  const toggleAudio = (audioUrl?: string) => {
    if (!audioUrl) return;
    
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audioUrl);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-4"><AudioGuideLoader variant="inline" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Add New Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Section title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSection()}
            />
            <Button onClick={addSection} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Sections */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No sections created yet. Add your first section above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Section {index + 1}</Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    onBlur={(e) => updateSection(section.id, { title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={section.description || ''}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    onBlur={(e) => updateSection(section.id, { description: e.target.value })}
                    rows={3}
                  />
                </div>

                {section.audio_url && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Audio Content</p>
                        {section.duration_seconds && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {Math.floor(section.duration_seconds / 60)}:
                            {(section.duration_seconds % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAudio(section.audio_url)}
                      >
                        {playingAudio === section.audio_url ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {playingAudio === section.audio_url && (
                      <audio
                        controls
                        autoPlay
                        className="w-full mt-2"
                        onEnded={() => setPlayingAudio(null)}
                      >
                        <source src={section.audio_url} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
