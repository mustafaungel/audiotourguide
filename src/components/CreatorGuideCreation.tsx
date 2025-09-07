import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { AudioGuideSectionManager, GuideSection } from './AudioGuideSectionManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CreatorGuideCreation() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    city: '',
    category: '',
    price: ''
  });
  
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [generatedImage, setGeneratedImage] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [errorImage, setErrorImage] = useState('');
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!formData.title || !formData.city || !formData.country) {
      toast.error('Please fill in title, city, and country before generating image');
      return;
    }

    setLoadingImage(true);
    setErrorImage('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          title: formData.title,
          city: formData.city,
          country: formData.country,
          category: formData.category
        }
      });

      if (error) throw error;

      if (data.imageContent) {
        setGeneratedImage(`data:image/webp;base64,${data.imageContent}`);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image received');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setErrorImage(error.message || 'Failed to generate image');
      toast.error('Failed to generate image');
    } finally {
      setLoadingImage(false);
    }
  };

  const createGuide = async () => {
    if (!formData.title || !formData.country || !formData.city || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (sections.length === 0) {
      toast.error('Please add at least one section to the guide');
      return;
    }

    setLoading(true);

    try {
      // First create the guide record
      const { data: guide, error: guideError } = await supabase
        .from('audio_guides')
        .insert({
          title: formData.title,
          description: `Audio guide for ${formData.title} in ${formData.city}, ${formData.country}`,
          location: `${formData.city}, ${formData.country}`,
          category: formData.category,
          price_usd: parseInt(formData.price) || 999,
          duration: sections.reduce((total, section) => total + (section.duration_seconds || 300), 0),
          difficulty: 'beginner',
          languages: [...new Set(sections.map(s => s.language))],
          currency: 'usd',
          creator_id: user?.id,
          image_url: generatedImage || null,
          sections: JSON.stringify(sections),
          is_published: false,
          is_approved: false
        })
        .select()
        .single();

      if (guideError) throw guideError;

      // Then create sections if any
      if (sections.length > 0) {
        const sectionsData = sections.map(section => ({
          guide_id: guide.id,
          title: section.title,
          description: section.description,
          audio_url: section.audio_url,
          duration_seconds: section.duration_seconds,
          language: section.language,
          order_index: section.order_index
        }));

        const { error: sectionsError } = await supabase
          .from('guide_sections')
          .insert(sectionsData);

        if (sectionsError) throw sectionsError;
      }
      
      toast.success('Audio guide created successfully! It will be reviewed by our team.');
      
      // Reset form
      setFormData({
        title: '',
        country: '',
        city: '',
        category: '',
        price: ''
      });
      setSections([]);
      setGeneratedImage('');
    } catch (error) {
      console.error('Error creating guide:', error);
      toast.error('Failed to create guide: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to create audio guides.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Audio Guide</CardTitle>
        <CardDescription>
          Create detailed audio guides with sections, audio files, and AI-generated images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Guide Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Goreme Open Air Museum"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="historical">Historical</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="architecture">Architecture</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="religious">Religious</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <CountrySelector
              value={formData.country}
              onValueChange={(value) => setFormData({...formData, country: value})}
              placeholder="Select country"
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="e.g., Cappadocia"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 999"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="max-w-xs"
            />
          </div>
        </div>

        <Separator />

        {/* AI Image Generation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Guide Image</h3>
          <div className="flex flex-wrap gap-4 items-start">
            <Button 
              onClick={generateImage}
              disabled={loadingImage || !formData.title || !formData.city || !formData.country}
              variant="outline"
            >
              {loadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate AI Image'
              )}
            </Button>
            
            {generatedImage && (
              <div className="max-w-sm">
                <img 
                  src={generatedImage} 
                  alt="Generated guide image"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </div>
          
          {errorImage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorImage}</AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Sections Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Guide Sections</h3>
          <p className="text-sm text-muted-foreground">
            Add sections to organize your audio guide content. Each section can have its own audio file and description.
          </p>
          
          <AudioGuideSectionManager
            sections={sections}
            onSectionsChange={setSections}
          />
        </div>

        <Separator />

        {/* Create Guide */}
        <div className="flex justify-end">
          <Button 
            onClick={createGuide}
            disabled={loading || !formData.title || !formData.country || !formData.city || !formData.category || !formData.price}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Guide'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}