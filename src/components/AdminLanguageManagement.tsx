import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Plus, Languages, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Guide {
  id: string;
  title: string;
  location: string;
  is_published: boolean;
  is_approved: boolean;
}

interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
}

interface GuideSection {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  order_index: number;
  language_code: string;
  is_original: boolean;
}

export default function AdminLanguageManagement() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [guideLanguages, setGuideLanguages] = useState<any[]>([]);
  const [originalSections, setOriginalSections] = useState<GuideSection[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translationSections, setTranslationSections] = useState<Partial<GuideSection>[]>([]);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGuides();
    fetchSupportedLanguages();
  }, []);

  useEffect(() => {
    if (selectedGuide) {
      fetchGuideLanguages(selectedGuide.id);
      fetchOriginalSections(selectedGuide.id);
    }
  }, [selectedGuide]);

  const fetchGuides = async () => {
    const { data, error } = await supabase
      .from('audio_guides')
      .select('id, title, location, is_published, is_approved')
      .order('title');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch guides",
        variant: "destructive",
      });
      return;
    }

    setGuides(data || []);
  };

  const fetchSupportedLanguages = async () => {
    const { data, error } = await supabase
      .from('supported_languages')
      .select('code, name, native_name')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch supported languages",
        variant: "destructive",
      });
      return;
    }

    setSupportedLanguages(data || []);
  };

  const fetchGuideLanguages = async (guideId: string) => {
    const { data, error } = await supabase
      .rpc('get_guide_languages', { p_guide_id: guideId });

    if (error) {
      console.error('Error fetching guide languages:', error);
      setGuideLanguages([]);
      return;
    }

    setGuideLanguages(data || []);
  };

  const fetchOriginalSections = async (guideId: string) => {
    const { data, error } = await supabase
      .from('guide_sections')
      .select('*')
      .eq('guide_id', guideId)
      .eq('is_original', true)
      .order('order_index');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch original sections",
        variant: "destructive",
      });
      return;
    }

    setOriginalSections(data || []);
  };

  const initializeTranslation = () => {
    const initialSections = originalSections.map(section => ({
      title: '',
      description: '',
      audio_url: '',
      order_index: section.order_index,
      guide_id: selectedGuide?.id,
      language_code: selectedLanguage,
      original_section_id: section.id,
      is_original: false,
    }));
    setTranslationSections(initialSections);
    setIsAddingLanguage(true);
  };

  const updateTranslationSection = (index: number, field: string, value: string) => {
    setTranslationSections(prev => prev.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    ));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file || !selectedGuide) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedGuide.id}/${selectedLanguage}/section-${index}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('guide-audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guide-audio')
        .getPublicUrl(fileName);

      updateTranslationSection(index, 'audio_url', publicUrl);

      toast({
        title: "Success",
        description: "Audio file uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload audio file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTranslations = async () => {
    if (!selectedGuide || !selectedLanguage) return;

    setLoading(true);
    try {
      const sectionsToInsert = translationSections
        .filter(section => section.title && section.title.trim() !== '')
        .map(section => ({
          ...section,
          guide_id: selectedGuide.id,
          title: section.title!,
          language_code: selectedLanguage,
          is_original: false,
        }));

      if (sectionsToInsert.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one translated section",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('guide_sections')
        .insert(sectionsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedLanguage.toUpperCase()} translation added successfully`,
      });

      // Refresh guide languages
      fetchGuideLanguages(selectedGuide.id);
      setIsAddingLanguage(false);
      setTranslationSections([]);
      setSelectedLanguage('');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save translations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableLanguages = supportedLanguages.filter(lang => 
    !guideLanguages.some(gl => gl.language_code === lang.code)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Languages className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Language Management</h2>
      </div>

      {/* Guide Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Guide to Manage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Label htmlFor="guide-select">Choose a guide:</Label>
            <Select onValueChange={(value) => {
              const guide = guides.find(g => g.id === value);
              setSelectedGuide(guide || null);
              setIsAddingLanguage(false);
              setSelectedLanguage('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a guide..." />
              </SelectTrigger>
              <SelectContent>
                {guides.map((guide) => (
                  <SelectItem key={guide.id} value={guide.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{guide.title} - {guide.location}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        guide.is_published 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {guide.is_published ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Current Languages */}
      {selectedGuide && (
        <Card>
          <CardHeader>
            <CardTitle>Current Languages for "{selectedGuide.title}"</CardTitle>
          </CardHeader>
          <CardContent>
            {guideLanguages.length > 0 ? (
              <div className="grid gap-2">
                {guideLanguages.map((lang) => (
                  <div key={lang.language_code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{lang.native_name}</span>
                      <span className="text-muted-foreground ml-2">({lang.language_name})</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {lang.section_count} sections
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {lang.language_code.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No languages found for this guide.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add New Language */}
      {selectedGuide && availableLanguages.length > 0 && !isAddingLanguage && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Language</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Label>Select language to add:</Label>
              <div className="flex gap-4">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.native_name} ({lang.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={initializeTranslation}
                  disabled={!selectedLanguage}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Start Translation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translation Form */}
      {isAddingLanguage && selectedLanguage && (
        <Card>
          <CardHeader>
            <CardTitle>
              Add {supportedLanguages.find(l => l.code === selectedLanguage)?.native_name} Translation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {originalSections.map((originalSection, index) => (
                <div key={originalSection.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Section {originalSection.order_index + 1}</h4>
                    <span className="text-sm text-muted-foreground">
                      Original: {originalSection.title}
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={translationSections[index]?.title || ''}
                        onChange={(e) => updateTranslationSection(index, 'title', e.target.value)}
                        placeholder={`Translate: ${originalSection.title}`}
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={translationSections[index]?.description || ''}
                        onChange={(e) => updateTranslationSection(index, 'description', e.target.value)}
                        placeholder={`Translate: ${originalSection.description || 'No description'}`}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Audio File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(index, file);
                          }}
                          className="flex-1"
                        />
                        {translationSections[index]?.audio_url && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-4">
                <Button onClick={saveTranslations} disabled={loading} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Translation'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingLanguage(false);
                    setTranslationSections([]);
                    setSelectedLanguage('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}