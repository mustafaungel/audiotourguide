import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, MoveUp, MoveDown } from 'lucide-react';
import { AudioUploader } from './AudioUploader';

export interface GuideSection {
  id: string;
  title: string;
  description: string;
  audio_url?: string;
  duration_seconds?: number;
  language: string;
  order_index: number;
}

interface AudioGuideSectionManagerProps {
  sections: GuideSection[];
  onSectionsChange: (sections: GuideSection[]) => void;
}

const LANGUAGES = [
  'English',
  'Turkish',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Japanese',
  'Chinese',
  'Korean',
  'Arabic'
];

export function AudioGuideSectionManager({ sections, onSectionsChange }: AudioGuideSectionManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const addSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: GuideSection = {
      id: crypto.randomUUID(),
      title: newSectionTitle,
      description: '',
      language: 'English',
      order_index: sections.length
    };

    onSectionsChange([...sections, newSection]);
    setNewSectionTitle('');
  };

  const updateSection = (id: string, updates: Partial<GuideSection>) => {
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);
  };

  const removeSection = (id: string) => {
    const updatedSections = sections
      .filter(section => section.id !== id)
      .map((section, index) => ({ ...section, order_index: index }));
    onSectionsChange(updatedSections);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(section => section.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedSections = [...sections];
    [updatedSections[currentIndex], updatedSections[newIndex]] = 
    [updatedSections[newIndex], updatedSections[currentIndex]];

    // Update order indices
    updatedSections.forEach((section, index) => {
      section.order_index = index;
    });

    onSectionsChange(updatedSections);
  };

  const handleAudioUploaded = (sectionId: string, audioUrl: string, duration: number) => {
    updateSection(sectionId, { 
      audio_url: audioUrl, 
      duration_seconds: duration 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Section title (e.g., 'Introduction', 'Main Hall', 'Chapel')"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSection()}
          className="flex-1"
        />
        <Button onClick={addSection} disabled={!newSectionTitle.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No sections added yet. Add sections to organize your audio guide content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections
            .sort((a, b) => a.order_index - b.order_index)
            .map((section, index) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Section {index + 1}: {section.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Section Title</label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Enter section title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={section.description}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      placeholder="Describe what this section covers..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select
                      value={section.language}
                      onValueChange={(value) => updateSection(section.id, { language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Audio File</label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-4">
                      <div className="flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">
                          Audio upload functionality will be implemented
                        </span>
                      </div>
                      {section.audio_url && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Current audio: {section.audio_url}
                          </p>
                        </div>
                      )}
                    </div>
                    {section.duration_seconds && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Duration: {Math.floor(section.duration_seconds / 60)}:
                        {(section.duration_seconds % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}