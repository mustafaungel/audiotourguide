import React, { useState, useRef, useEffect } from 'react';
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
  language_code?: string;
  order_index: number;
}

interface AudioGuideSectionManagerProps {
  sections: GuideSection[];
  onSectionsChange: (sections: GuideSection[]) => void;
  guideId?: string;
  guideTitle?: string;
  location?: string;
  category?: string;
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

const LANGUAGE_CODE_MAP: { [key: string]: string } = {
  'English': 'en',
  'Turkish': 'tr',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Russian': 'ru',
  'Japanese': 'ja',
  'Chinese': 'zh',
  'Korean': 'ko',
  'Arabic': 'ar'
};

export function AudioGuideSectionManager({ sections, onSectionsChange, guideId, guideTitle, location, category }: AudioGuideSectionManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionLanguage, setNewSectionLanguage] = useState('English');
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Calculate total duration from all sections
  const calculateTotalDuration = (sectionsData: GuideSection[]): number => {
    return sectionsData.reduce((total, section) => {
      if (section.duration_seconds) {
        return total + section.duration_seconds;
      }
      // Fallback: estimate duration from description length (rough estimate: 150 words per minute)
      if (section.description) {
        const wordCount = section.description.split(' ').length;
        const estimatedMinutes = wordCount / 150;
        return total + Math.ceil(estimatedMinutes * 60);
      }
      return total;
    }, 0);
  };

  // Update guide duration in the database
  const updateGuideDuration = async (sectionsData: GuideSection[]) => {
    if (!guideId) return;
    
    try {
      const totalDuration = calculateTotalDuration(sectionsData);
      
      const { error } = await supabase
        .from('audio_guides')
        .update({ duration: totalDuration })
        .eq('id', guideId);

      if (error) {
        console.error('Error updating guide duration:', error);
      }
    } catch (error) {
      console.error('Error updating guide duration:', error);
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    if (!guideId) {
      toast.error('Guide ID is required to add sections');
      return;
    }

    try {
      const newSection = {
        guide_id: guideId,
        title: newSectionTitle,
        description: '',
        language: newSectionLanguage,
        language_code: LANGUAGE_CODE_MAP[newSectionLanguage] || 'en',
        order_index: sections.length
      };

      const { data, error } = await supabase
        .from('guide_sections')
        .insert([newSection])
        .select()
        .single();

      if (error) throw error;

      const sectionWithLocalData: GuideSection = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        language: data.language,
        order_index: data.order_index
      };

      const updatedSections = [...sections, sectionWithLocalData];
      onSectionsChange(updatedSections);
      setNewSectionTitle('');
      
      // Update guide duration
      await updateGuideDuration(updatedSections);

      // Trigger localStorage event for real-time updates
      window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: `guide_updated_${guideId}`,
        newValue: Date.now().toString()
      }));
      
      toast.success('Section added successfully!');

    } catch (error: any) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    }
  };

  const updateSection = async (id: string, updates: Partial<GuideSection>) => {
    // Update local state immediately for UI responsiveness
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);

    // Save to database if guideId exists
    if (guideId) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.language !== undefined) {
          dbUpdates.language = updates.language;
          dbUpdates.language_code = LANGUAGE_CODE_MAP[updates.language] || 'en'; // Proper language code mapping
        }
        if (updates.audio_url !== undefined) dbUpdates.audio_url = updates.audio_url;
        if (updates.duration_seconds !== undefined) dbUpdates.duration_seconds = updates.duration_seconds;
        if (updates.order_index !== undefined) dbUpdates.order_index = updates.order_index;

        const { error } = await supabase
          .from('guide_sections')
          .update(dbUpdates)
          .eq('id', id);

        if (error) throw error;

        // Update guide duration if audio-related changes
        if (updates.duration_seconds !== undefined || updates.audio_url !== undefined) {
          await updateGuideDuration(updatedSections);
          
          // Trigger localStorage event for real-time updates
          window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
          window.dispatchEvent(new StorageEvent('storage', {
            key: `guide_updated_${guideId}`,
            newValue: Date.now().toString()
          }));
        }

      } catch (error: any) {
        console.error('Error updating section:', error);
        toast.error('Failed to save section changes');
      }
    }
  };

  const removeSection = async (id: string) => {
    try {
      // Delete from database if guideId exists
      if (guideId) {
        const { error } = await supabase
          .from('guide_sections')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // Update local state
      const updatedSections = sections
        .filter(section => section.id !== id)
        .map((section, index) => ({ ...section, order_index: index }));
      
      onSectionsChange(updatedSections);

      // Update order indices in database
      if (guideId) {
        for (let i = 0; i < updatedSections.length; i++) {
          await supabase
            .from('guide_sections')
            .update({ order_index: i })
            .eq('id', updatedSections[i].id);
        }
        
        // Update guide duration after section removal
        await updateGuideDuration(updatedSections);
        
        // Trigger localStorage event for real-time updates
        window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', {
          key: `guide_updated_${guideId}`,
          newValue: Date.now().toString()
        }));
      }

      toast.success('Section removed successfully!');

    } catch (error: any) {
      console.error('Error removing section:', error);
      toast.error('Failed to remove section');
    }
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
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

    // Update order indices in database
    if (guideId) {
      try {
        for (let i = 0; i < updatedSections.length; i++) {
          await supabase
            .from('guide_sections')
            .update({ order_index: i })
            .eq('id', updatedSections[i].id);
        }
      } catch (error: any) {
        console.error('Error updating section order:', error);
        toast.error('Failed to update section order');
      }
    }
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
      const updatedSections = sections.map(section =>
        section.id === sectionId 
          ? { ...section, audio_url: publicUrl, duration_seconds: duration }
          : section
      );
      
      updateSection(sectionId, {
        audio_url: publicUrl,
        duration_seconds: duration
      });

      setUploadProgress(100);
      
      // Update guide duration after audio upload
      await updateGuideDuration(updatedSections);
      
      // Trigger localStorage event for real-time updates
      window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: `guide_updated_${guideId}`,
        newValue: Date.now().toString()
      }));
      
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
      const updatedSections = sections.map(section =>
        section.id === sectionId 
          ? { ...section, audio_url: undefined, duration_seconds: undefined }
          : section
      );
      
      updateSection(sectionId, {
        audio_url: undefined,
        duration_seconds: undefined
      });

      // Update guide duration after audio removal
      await updateGuideDuration(updatedSections);
      
      // Trigger localStorage event for real-time updates
      window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: `guide_updated_${guideId}`,
        newValue: Date.now().toString()
      }));

      toast.success('Audio file removed');
    } catch (error) {
      console.error('Error removing audio:', error);
      toast.error('Failed to remove audio file');
    }
  };

  const playAudio = (audioUrl: string, sectionId: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingSection(null);
    }

    // If clicking the same section, just stop (toggle behavior)
    if (playingSection === sectionId) {
      return;
    }

    // Create new audio and play
    const audio = new Audio(audioUrl);
    audio.addEventListener('ended', () => {
      setCurrentAudio(null);
      setPlayingSection(null);
    });
    
    audio.play().then(() => {
      setCurrentAudio(audio);
      setPlayingSection(sectionId);
    }).catch(error => {
      console.error('Error playing audio:', error);
      toast.error('Could not play audio file');
      setCurrentAudio(null);
      setPlayingSection(null);
    });
  };

  const generateSectionDescription = async (sectionId: string, sectionTitle: string) => {
    if (!sectionTitle.trim()) {
      toast.error('Please enter a section title first');
      return;
    }

    setGeneratingDescription(sectionId);

    try {
      const { data, error } = await supabase.functions.invoke('generate-section-description', {
        body: {
          sectionTitle,
          guideTitle,
          location,
          category
        }
      });

      if (error) throw error;

      updateSection(sectionId, { description: data.description });
      toast.success('AI description generated successfully!');

    } catch (error: any) {
      console.error('Error generating section description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(null);
    }
  };

  const generateSectionAudio = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section?.description?.trim()) {
      toast.error('Please add a description first before generating audio');
      return;
    }

    setGeneratingAudio(sectionId);

    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: {
          text: section.description,
          voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
          modelId: 'eleven_multilingual_v2'
        }
      });

      if (error) throw error;

      // Update section with generated audio and actual duration
      const actualDuration = data.duration_seconds || Math.ceil(section.description.length / 10);
      const updatedSections = sections.map(s =>
        s.id === sectionId 
          ? { ...s, audio_url: data.audio_url, duration_seconds: actualDuration }
          : s
      );
      
      updateSection(sectionId, { 
        audio_url: data.audio_url,
        duration_seconds: actualDuration
      });
      
      // Update guide duration after audio generation
      await updateGuideDuration(updatedSections);
      
      // Trigger localStorage event for real-time updates
      window.localStorage.setItem(`guide_updated_${guideId}`, Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: `guide_updated_${guideId}`,
        newValue: Date.now().toString()
      }));
      
      toast.success('Audio generated successfully!');

    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio. Please try again.');
    } finally {
      setGeneratingAudio(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

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
        <Select value={newSectionLanguage} onValueChange={setNewSectionLanguage}>
          <SelectTrigger className="w-[180px]">
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
                      value={section.title || ''}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Enter section title"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Description</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSectionDescription(section.id, section.title)}
                        disabled={!section.title?.trim() || generatingDescription === section.id}
                      >
                        {generatingDescription === section.id ? 'Generating...' : 'Generate AI Description'}
                      </Button>
                    </div>
                    <Textarea
                      value={section.description || ''}
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
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[section.id]?.click()}
                              >
                                <FileAudio className="h-4 w-4 mr-2" />
                                Choose Audio File
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateSectionAudio(section.id)}
                                disabled={!section.description?.trim() || generatingAudio === section.id}
                              >
                                {generatingAudio === section.id ? 'Generating...' : 'Generate AI Audio'}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Upload your own file or generate with AI • Max 50MB
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
                              onClick={() => playAudio(section.audio_url!, section.id)}
                            >
                              <Play className="h-4 w-4" />
                              {playingSection === section.id ? 'Pause' : 'Play'}
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