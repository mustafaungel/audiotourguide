import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Upload, MoveUp, MoveDown, Play, X, FileAudio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  guideId?: string;
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

export function AudioGuideSectionManager({ sections, onSectionsChange, guideId }: AudioGuideSectionManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const handleFileSelect = (sectionId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    uploadAudioFile(sectionId, file);
  };

  const uploadAudioFile = async (sectionId: string, file: File) => {
    setUploadingSection(sectionId);
    setUploadProgress(0);

    try {
      // Generate unique file name
      const timestamp = Date.now();
      const fileName = guideId 
        ? `guide-${guideId}-section-${sectionId}-${timestamp}.mp3`
        : `section-${sectionId}-${timestamp}.mp3`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('guide-audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('guide-audio')
        .getPublicUrl(fileName);

      // Get audio duration
      const duration = await getAudioDuration(file);

      // Update section with audio URL and duration
      updateSection(sectionId, {
        audio_url: publicUrl,
        duration_seconds: duration
      });

      setUploadProgress(100);
      toast.success('Audio uploaded successfully!');

    } catch (error: any) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio file');
    } finally {
      setUploadingSection(null);
      setUploadProgress(0);
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(audio.duration));
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(0); // Default to 0 if can't get duration
      });
      
      audio.src = url;
    });
  };

  const removeAudioFile = async (sectionId: string, audioUrl: string) => {
    try {
      // Extract file name from URL
      const fileName = audioUrl.split('/').pop();
      if (fileName) {
        const { error } = await supabase.storage
          .from('guide-audio')
          .remove([fileName]);
        
        if (error) {
          console.error('Error removing file from storage:', error);
        }
      }

      // Update section to remove audio
      updateSection(sectionId, {
        audio_url: undefined,
        duration_seconds: undefined
      });

      toast.success('Audio file removed');
    } catch (error) {
      console.error('Error removing audio:', error);
      toast.error('Failed to remove audio file');
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast.error('Could not play audio file');
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
                    
                    {/* File Input (Hidden) */}
                    <input
                      ref={(el) => fileInputRefs.current[section.id] = el}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(section.id, file);
                      }}
                      className="hidden"
                    />

                    {/* Upload Area */}
                    {!section.audio_url ? (
                      <div className="border-2 border-dashed border-muted rounded-lg p-4">
                        {uploadingSection === section.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <Upload className="h-6 w-6 text-primary mr-2 animate-pulse" />
                              <span className="text-sm">Uploading audio...</span>
                            </div>
                            <Progress value={uploadProgress} className="w-full" />
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center">
                              <Upload className="h-8 w-8 text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">
                                Click to upload audio file
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRefs.current[section.id]?.click()}
                            >
                              <FileAudio className="h-4 w-4 mr-2" />
                              Choose Audio File
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Supports MP3, WAV, M4A • Max 50MB
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Audio Uploaded State */
                      <div className="border border-muted rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileAudio className="h-6 w-6 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Audio uploaded</p>
                              {section.duration_seconds && (
                                <p className="text-xs text-muted-foreground">
                                  Duration: {Math.floor(section.duration_seconds / 60)}:
                                  {(section.duration_seconds % 60).toString().padStart(2, '0')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => playAudio(section.audio_url!)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRefs.current[section.id]?.click()}
                            >
                              Replace
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeAudioFile(section.id, section.audio_url!)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
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