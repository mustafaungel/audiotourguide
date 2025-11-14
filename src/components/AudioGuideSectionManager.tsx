import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload, MoveUp, MoveDown, Play, X, FileAudio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLanguageFlag } from '@/lib/language-utils';

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

    // Validate file type - accept common audio formats
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm'];
    const isValidAudio = file.type.startsWith('audio/') || validAudioTypes.includes(file.type);
    
    if (!isValidAudio) {
      toast.error('Please select a valid audio file (MP3, M4A, WAV, OGG, or WEBM)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 50MB.`);
      return;
    }

    console.log('[AUDIO-UPLOAD] File validation passed:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    uploadAudioFile(sectionId, file);
  };

  const uploadAudioFile = async (sectionId: string, file: File) => {
    setUploadingSection(sectionId);
    setUploadProgress(0);

    try {
      // Detect file extension from the actual file name
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const timestamp = Date.now();
      const fileName = guideId 
        ? `guide-${guideId}-section-${sectionId}-${timestamp}.${fileExtension}`
        : `section-${sectionId}-${timestamp}.${fileExtension}`;

      console.log('[AUDIO-UPLOAD] Starting upload:', {
        fileName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        extension: fileExtension
      });

      // Upload to Supabase Storage with explicit content type
      const { data, error } = await supabase.storage
        .from('guide-audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'audio/mpeg'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('guide-audio')
        .getPublicUrl(fileName);

      console.log('[AUDIO-UPLOAD] Upload successful, public URL:', publicUrl.substring(0, 60) + '...');

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
      // Detailed error logging
      console.error('❌ [AUDIO-UPLOAD] Upload failed with detailed error:', {
        message: error.message,
        name: error.name,
        status: error.status,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        hint: error.hint,
        statusText: error.statusText,
        fullError: error
      });

      // User-friendly error messages based on error type
      let errorMessage = 'Failed to upload audio file';
      
      if (error.status === 413 || error.statusCode === 413 || error.message?.includes('Payload too large')) {
        errorMessage = 'File is too large (max 50MB). Please use a smaller file.';
      } else if (error.status === 415 || error.statusCode === 415 || error.message?.includes('Unsupported Media Type')) {
        errorMessage = 'File format not supported. Please use MP3, M4A, WAV, or OGG.';
      } else if (error.status === 401 || error.status === 403 || error.statusCode === 401 || error.statusCode === 403) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'File already exists. Please try again.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
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

  // Group sections by language
  const groupedSections = sections.reduce((acc, section) => {
    const lang = section.language || 'English';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(section);
    return acc;
  }, {} as Record<string, GuideSection[]>);

  const languages = Object.keys(groupedSections);

  return (
    <div className="space-y-6">
      {/* Add New Section - Always Visible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="section-title" className="text-sm mb-2 block">
                Section Title
              </Label>
              <Input
                id="section-title"
                placeholder="e.g., 'Introduction', 'Main Hall', 'Chapel'"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSection()}
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Label htmlFor="section-language" className="text-sm mb-2 block">
                Language
              </Label>
              <Select value={newSectionLanguage} onValueChange={setNewSectionLanguage}>
                <SelectTrigger id="section-language">
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
            <div className="flex items-end">
              <Button onClick={addSection} disabled={!newSectionTitle.trim()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Existing Sections - Grouped by Language */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No sections added yet. Add sections to organize your audio guide content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Existing Sections</h3>
            <p className="text-sm text-muted-foreground">
              Sections organized by language. Expand each language to view and edit.
            </p>
          </div>
          
          <Accordion type="multiple" defaultValue={languages} className="space-y-2">
            {languages.map((language) => {
              const languageSections = groupedSections[language].sort(
                (a, b) => a.order_index - b.order_index
              );
              
              return (
                <AccordionItem key={language} value={language} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getLanguageFlag(LANGUAGE_CODE_MAP[language] || 'en')}</span>
                      <span className="font-semibold">{language}</span>
                      <Badge variant="secondary" className="ml-2">
                        {languageSections.length} {languageSections.length === 1 ? 'section' : 'sections'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {languageSections.map((section, index) => (
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
                                  disabled={index === languageSections.length - 1}
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
                              <Label htmlFor={`title-${section.id}`} className="text-sm mb-2 block">
                                Section Title
                              </Label>
                              <Input
                                id={`title-${section.id}`}
                                value={section.title || ''}
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                placeholder="Enter section title"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label htmlFor={`description-${section.id}`} className="text-sm">
                                  Description
                                </Label>
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
                                id={`description-${section.id}`}
                                value={section.description || ''}
                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                placeholder="Describe what this section covers..."
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`language-${section.id}`} className="text-sm mb-2 block">
                                Language
                              </Label>
                              <Select
                                value={section.language}
                                onValueChange={(value) => updateSection(section.id, { language: value })}
                              >
                                <SelectTrigger id={`language-${section.id}`}>
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
                              <Label className="text-sm mb-2 block">Audio File</Label>
                              
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}