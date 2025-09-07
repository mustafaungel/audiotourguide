import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Copy, QrCode, Share } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { AudioGuideSectionManager, GuideSection } from './AudioGuideSectionManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export function CreatorGuideCreation() {
  const { user } = useAuth();
  
  const [tempGuideId] = useState(() => crypto.randomUUID());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: '',
    city: '',
    category: '',
    price: ''
  });
  
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [generatedImage, setGeneratedImage] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [errorImage, setErrorImage] = useState('');
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdGuide, setCreatedGuide] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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

  const generateDescription = async () => {
    if (!formData.title || !formData.city || !formData.country || !formData.category) {
      toast.error('Please fill in title, city, country, and category first');
      return;
    }

    setDescriptionLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-guide-description', {
        body: {
          title: formData.title,
          city: formData.city,
          country: formData.country,
          category: formData.category
        }
      });

      if (error) throw error;
      
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast.success('Description generated successfully!');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description');
    } finally {
      setDescriptionLoading(false);
    }
  };

  const generateQRCodeAndShareLink = async (guideId: string) => {
    try {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/guide/${guideId}`;
      
      // Generate QR code with custom styling
      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      // Update the guide with QR code and share URL
      const { error: updateError } = await supabase
        .from('audio_guides')
        .update({
          qr_code_url: qrCodeDataUrl,
          share_url: shareUrl
        })
        .eq('id', guideId);

      if (updateError) {
        console.error('Error updating guide with QR code:', updateError);
        return;
      }

      setQrCodeUrl(qrCodeDataUrl);
      setShareUrl(shareUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
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
      // Use the create-guide edge function
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: {
          title: formData.title,
          description: formData.description || `Audio guide for ${formData.title} in ${formData.city}, ${formData.country}`,
          location: `${formData.city}, ${formData.country}`,
          category: formData.category,
          price_usd: parseInt(formData.price) || 999,
          difficulty: 'beginner',
          languages: [...new Set(sections.map(s => s.language))],
          sections: sections,
          image_content: generatedImage ? generatedImage.split(',')[1] : null, // Extract base64
          generate_audio: true
        }
      });

      if (error) throw error;

      setCreatedGuide(data.guide);
      setQrCodeUrl(data.guide.qr_code_url);
      setShareUrl(data.guide.share_url);
      
      toast.success(`${data.message || 'Audio guide created successfully with QR code and share link!'}`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
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
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="description">Guide Description *</Label>
              <span className="text-xs text-muted-foreground">
                {formData.description.length}/100
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Brief description of the guide..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              maxLength={100}
              className="min-h-[60px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDescription}
              disabled={descriptionLoading || !formData.title || !formData.city || !formData.country || !formData.category}
              className="w-full mt-2"
            >
              {descriptionLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate AI Description'
              )}
            </Button>
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
                  Generating (15-30s)...
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
            guideId={tempGuideId}
            guideTitle={formData.title}
            location={`${formData.city}, ${formData.country}`}
            category={formData.category}
          />
        </div>

        <Separator />

        {/* QR Code and Share Link Display */}
        {createdGuide && qrCodeUrl && shareUrl && (
          <>
            <Separator />
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Guide Created Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-green-700 font-medium">QR Code</Label>
                    <div className="flex justify-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code for guide" 
                        className="border rounded-lg shadow-sm"
                      />
                    </div>
                    <p className="text-sm text-green-600 text-center">
                      Scan to access your guide
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">Share Link</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={shareUrl} 
                          readOnly 
                          className="bg-white text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(shareUrl, 'Share link')}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">Guide Details</Label>
                      <div className="text-sm space-y-1">
                        <p><strong>Title:</strong> {createdGuide.title}</p>
                        <p><strong>Location:</strong> {createdGuide.location}</p>
                        <p><strong>Price:</strong> ${(createdGuide.price_usd / 100).toFixed(2)}</p>
                        <p><strong>Status:</strong> Pending Approval</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setCreatedGuide(null);
                        setQrCodeUrl(null);
                        setShareUrl(null);
                      }}
                    >
                      Create Another Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

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