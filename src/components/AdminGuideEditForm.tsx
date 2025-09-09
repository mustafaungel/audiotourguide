import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, ArrowLeft, QrCode, ExternalLink, Copy, Link2, Edit3 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GuideSectionsManager } from './GuideSectionsManager';
import { getGuidePreviewUrl } from '@/lib/url-utils';
import { generateSlugPreview, validateSlug, sanitizeSlug } from '@/lib/slug-utils';

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price_usd: number;
  is_approved: boolean;
  is_published: boolean;
  created_at: string;
  creator_id: string;
  slug?: string;
  qr_code_url?: string | null;
  share_url?: string | null;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface AdminGuideEditFormProps {
  onBack: () => void;
}

export const AdminGuideEditForm = ({ onBack }: AdminGuideEditFormProps) => {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugPreview, setSlugPreview] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    price_usd: 0,
    image_urls: [] as string[],
    is_featured: false,
  });

  useEffect(() => {
    // Load guide data from sessionStorage
    const editingGuideData = sessionStorage.getItem('editingGuide');
    if (editingGuideData) {
      const guideData = JSON.parse(editingGuideData);
      setGuide(guideData);
      setFormData({
        title: guideData.title,
        description: guideData.description,
        location: guideData.location,
        category: guideData.category,
        price_usd: guideData.price_usd / 100, // Convert from cents to dollars
        image_urls: guideData.image_urls || [],
        is_featured: guideData.is_featured || false,
      });
      setCustomSlug(guideData.slug || '');
    }
  }, []);

  // Update slug preview when title or location changes
  useEffect(() => {
    if (!editingSlug) {
      const preview = generateSlugPreview(formData.title, formData.location);
      setSlugPreview(preview);
    }
  }, [formData.title, formData.location, editingSlug]);

  const handleInputChange = (field: string, value: string | number | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSlugEdit = (editing: boolean) => {
    setEditingSlug(editing);
    if (editing) {
      setCustomSlug(guide?.slug || slugPreview);
    } else {
      setCustomSlug('');
      setSlugError('');
    }
  };

  const handleSlugChange = (value: string) => {
    const sanitized = sanitizeSlug(value);
    setCustomSlug(sanitized);
    
    const validation = validateSlug(sanitized);
    setSlugError(validation.isValid ? '' : validation.error || '');
  };

  const saveSlug = async () => {
    if (!guide || slugError) return;
    
    const finalSlug = customSlug || slugPreview;
    
    try {
      const { error } = await supabase
        .from('audio_guides')
        .update({ slug: finalSlug })
        .eq('id', guide.id);

      if (error) throw error;
      
      setGuide(prev => prev ? { ...prev, slug: finalSlug } : null);
      setEditingSlug(false);
      toast.success('Slug updated successfully!');
    } catch (error) {
      console.error('Error updating slug:', error);
      toast.error('Failed to update slug');
    }
  };

  const updateGuide = async () => {
    if (!guide) return;
    
    // Validate price before updating
    if (formData.price_usd < 0.50) {
      toast.error('Price must be at least $0.50 due to Stripe requirements');
      return;
    }
    
    setLoading(true);
    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        price_usd: Math.round(formData.price_usd * 100), // Convert to cents
        image_urls: formData.image_urls,
        image_url: formData.image_urls[0] || null, // Update image_url for backward compatibility
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      // Include slug if it's being edited or auto-generated
      if (editingSlug && customSlug) {
        updateData.slug = customSlug;
      } else if (!guide.slug) {
        updateData.slug = slugPreview;
      }

      const { error } = await supabase
        .from('audio_guides')
        .update(updateData)
        .eq('id', guide.id);

      if (error) throw error;

      toast.success('Guide updated successfully!');
      
      // Clear sessionStorage
      sessionStorage.removeItem('editingGuide');
      
      // Go back to content management
      onBack();
    } catch (error) {
      console.error('Error updating guide:', error);
      toast.error('Failed to update guide');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!guide) return;
    
    setGeneratingQR(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: { guideId: guide.id }
      });

      if (error) throw error;

      // Update local guide state with new QR code data
      setGuide(prev => prev ? {
        ...prev,
        qr_code_url: data.qr_code_url,
        share_url: data.share_url
      } : null);

      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (err) {
      toast.error(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  const openGuidePreview = () => {
    if (!guide) return;
    const url = getGuidePreviewUrl(guide.id);
    window.open(url, '_blank');
  };

  if (!guide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Management
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No guide selected for editing</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content Management
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Edit Guide</h2>
          <p className="text-muted-foreground">Modify guide details and content</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guide Information</CardTitle>
            <CardDescription>Update basic guide details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter guide title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter guide description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Paris, France"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="historical">Historical</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="art">Art & Museums</SelectItem>
                  <SelectItem value="architecture">Architecture</SelectItem>
                  <SelectItem value="religious">Religious Sites</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (USD) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0.50"
                value={formData.price_usd}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (value > 0 && value < 0.50) {
                    toast.error('Price must be at least $0.50 due to Stripe requirements');
                  }
                  handleInputChange('price_usd', value);
                }}
                placeholder="0.50"
                className={formData.price_usd > 0 && formData.price_usd < 0.50 ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Minimum price: $0.50 (Stripe requirement)
              </p>
              {formData.price_usd > 0 && formData.price_usd < 0.50 && (
                <p className="text-xs text-red-500">
                  Price below $0.50 will cause payment failures
                </p>
              )}
            </div>

            {/* Featured Toggle */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
                <Label htmlFor="featured" className="font-medium">
                  Featured Guide
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Featured guides appear prominently on the homepage and get more visibility.
              </p>
            </div>

            {/* URL Slug Management */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Slug
              </Label>
              
              {!editingSlug ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <span className="text-sm text-muted-foreground">audiotourguide.app/guide/</span>
                    <span className="text-sm font-mono text-foreground">
                      {guide.slug || slugPreview || 'auto-generated'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSlugEdit(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit Slug
                    </Button>
                    {!guide.slug && (
                      <span className="text-xs text-muted-foreground self-center">
                        Auto-generated from title and location
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      audiotourguide.app/guide/
                    </span>
                    <Input
                      value={customSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="enter-custom-slug"
                      className={`font-mono ${slugError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {slugError && (
                    <p className="text-red-500 text-sm">{slugError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={saveSlug}
                      disabled={!!slugError || !customSlug}
                    >
                      Save Slug
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSlugEdit(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Image Management */}
            <div className="space-y-2">
              <Label>Guide Images</Label>
              <ImageUploader
                onImagesUploaded={(urls) => handleInputChange('image_urls', urls)}
                currentImages={formData.image_urls}
                maxImages={5}
              />
            </div>

            <Button
              onClick={updateGuide}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Guide...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Guide
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guide Sections</CardTitle>
            <CardDescription>Manage audio sections and content</CardDescription>
          </CardHeader>
          <CardContent>
            <GuideSectionsManager guideId={guide.id} />
          </CardContent>
        </Card>
      </div>

      {/* QR Code and Share Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code & Sharing
          </CardTitle>
          <CardDescription>
            Generate QR codes and manage sharing options for this guide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={generateQRCode}
              disabled={generatingQR}
            >
              {generatingQR ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              {guide.qr_code_url ? 'Regenerate QR Code' : 'Generate QR Code'}
            </Button>
            <Button 
              variant="outline" 
              onClick={openGuidePreview}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Guide
            </Button>
          </div>

          {(guide.qr_code_url || guide.share_url) && (
            <div className="grid gap-4 md:grid-cols-2">
              {guide.qr_code_url && (
                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-border">
                    <img 
                      src={guide.qr_code_url} 
                      alt="QR Code for guide"
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Users can scan this to access the guide
                  </p>
                </div>
              )}
              
              {guide.share_url && (
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono truncate">
                      {guide.share_url}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(guide.share_url!, 'Share link')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Direct link to the guide page
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};