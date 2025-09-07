import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Eye, Share } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { AudioGuideSectionManager, GuideSection } from './AudioGuideSectionManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price_usd: number;
  difficulty: string;
  is_published: boolean;
  is_approved: boolean;
  languages: string[];
  image_url?: string;
  share_url?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

interface CreatorGuideEditFormProps {
  onBack: () => void;
}

export function CreatorGuideEditForm({ onBack }: CreatorGuideEditFormProps) {
  const { user } = useAuth();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: '',
    city: '',
    category: '',
    price: '',
    difficulty: '',
    is_published: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get guide data from sessionStorage (set by parent component)
    const selectedGuide = sessionStorage.getItem('selectedGuideForEdit');
    if (selectedGuide) {
      const guideData = JSON.parse(selectedGuide);
      setGuide(guideData);
      
      // Parse location into country and city
      const locationParts = guideData.location.split(', ');
      const city = locationParts.length > 1 ? locationParts[0] : '';
      const country = locationParts.length > 1 ? locationParts[1] : guideData.location;
      
      setFormData({
        title: guideData.title,
        description: guideData.description,
        country: country,
        city: city,
        category: guideData.category,
        price: (guideData.price_usd / 100).toString(),
        difficulty: guideData.difficulty,
        is_published: guideData.is_published
      });
      
      fetchGuideSections(guideData.id);
    }
  }, []);

  const fetchGuideSections = async (guideId: string) => {
    try {
      const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('guide_id', guideId)
        .order('order_index');

      if (error) throw error;

      setSections(data || []);
    } catch (error) {
      console.error('Error fetching guide sections:', error);
      toast.error('Failed to load guide sections');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateGuide = async () => {
    if (!guide || !formData.title || !formData.country || !formData.city || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const location = `${formData.city}, ${formData.country}`;
      const priceInCents = parseInt(formData.price) * 100;

      const { error } = await supabase
        .from('audio_guides')
        .update({
          title: formData.title,
          description: formData.description,
          location: location,
          category: formData.category,
          price_usd: priceInCents,
          difficulty: formData.difficulty,
          is_published: formData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', guide.id)
        .eq('creator_id', user?.id); // Ensure user can only edit their own guides

      if (error) throw error;

      toast.success('Guide updated successfully!');
      
      // Update the guide state
      setGuide(prev => prev ? {
        ...prev,
        title: formData.title,
        description: formData.description,
        location: location,
        category: formData.category,
        price_usd: priceInCents,
        difficulty: formData.difficulty,
        is_published: formData.is_published
      } : null);

    } catch (error) {
      console.error('Error updating guide:', error);
      toast.error('Failed to update guide');
    } finally {
      setSaving(false);
    }
  };

  const previewGuide = () => {
    if (guide) {
      const baseUrl = window.location.origin;
      window.open(`${baseUrl}/guide/${guide.id}`, '_blank');
    }
  };

  const shareGuide = async () => {
    if (guide?.share_url) {
      try {
        await navigator.clipboard.writeText(guide.share_url);
        toast.success('Share link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy share link');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!guide) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No guide selected for editing.</p>
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guides
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Edit Guide
            </CardTitle>
            <CardDescription>
              Update your audio guide information and manage its sections
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={guide.is_approved ? "default" : "secondary"}>
              {guide.is_approved ? "Approved" : "Pending Approval"}
            </Badge>
            <Badge variant={formData.is_published ? "default" : "outline"}>
              {formData.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Guide Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Guide Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
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
              onValueChange={(value) => handleInputChange('country', value)}
              placeholder="Select country"
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Publishing Controls */}
        {guide.is_approved && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="published">Publish Guide</Label>
                <p className="text-sm text-muted-foreground">
                  Make this guide available for purchase
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={(checked) => handleInputChange('is_published', checked)}
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={updateGuide} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          
          <Button variant="outline" onClick={previewGuide}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          {guide.share_url && (
            <Button variant="outline" onClick={shareGuide}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        <Separator />

        {/* Sections Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Guide Sections</h3>
          <p className="text-sm text-muted-foreground">
            Manage the audio sections of your guide. Changes to sections are saved automatically.
          </p>
          
          <AudioGuideSectionManager
            sections={sections}
            onSectionsChange={setSections}
            guideId={guide.id}
            guideTitle={formData.title}
            location={`${formData.city}, ${formData.country}`}
            category={formData.category}
          />
        </div>
      </CardContent>
    </Card>
  );
}