import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText, Plus, ImageIcon, Copy, QrCode, Edit2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';

import { AdminMobileNavigation } from '@/components/AdminMobileNavigation';
import { CountrySelector } from '@/components/CountrySelector';
import { AudioGuideSectionManager } from '@/components/AudioGuideSectionManager';
import { AdminGuideEditForm } from '@/components/AdminGuideEditForm';
import { AdminContactManagement } from '@/components/AdminContactManagement';

import { ImageUploader } from '@/components/ImageUploader';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminPanel = () => {
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Listen for tab change events from GuideManagement
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('admin-tab-change', handleTabChange as EventListener);
    return () => window.removeEventListener('admin-tab-change', handleTabChange as EventListener);
  }, []);

  // Form data state
  const [tempGuideId] = useState(() => crypto.randomUUID());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    country: '',
    category: 'Cultural Heritage',
    price: '12'
  });

  // Section management
  const [sections, setSections] = useState<any[]>([]);

  // Publication state
  const [isHidden, setIsHidden] = useState(false);

  // Generation states
  const [imageLoading, setImageLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  
  // Generated content
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [createdGuide, setCreatedGuide] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateImage = async () => {
    if (!formData.title || !formData.city || !formData.country) {
      toast.error('Please fill in title, city, and country first.');
      return;
    }

    setImageLoading(true);
    
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
        const imageUrl = `data:image/webp;base64,${data.imageContent}`;
        setUploadedImages([imageUrl]);
        toast.success('AI has created your guide image successfully.');
      } else {
        throw new Error('No image received');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.city || !formData.country || !formData.category) {
      toast.error('Please fill in title, city, country, and category first.');
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
        handleInputChange('description', data.description);
        toast.success('AI has created your guide description successfully.');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
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
    if (!formData.title || !formData.city || !formData.country || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (sections.length === 0) {
      toast.error('Please add at least one section to your guide.');
      return;
    }

    setPublishLoading(true);
    
    try {
      // Use the create-guide edge function for consistency
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: {
          title: formData.title,
          description: formData.description || `Explore ${formData.title} in ${formData.city}, ${formData.country}`,
          location: `${formData.city}, ${formData.country}`,
          category: formData.category,
          price_usd: parseInt(formData.price),
          difficulty: 'intermediate',
          languages: ['English'],
          sections: sections,
          image_urls: uploadedImages,
          is_published: !isHidden,
          generate_audio: true
        }
      });

      if (error) throw error;

      setCreatedGuide(data.guide);
      setQrCodeUrl(data.guide.qr_code_url);
      setShareUrl(data.guide.share_url);
      
      // Show appropriate success message based on access type
      if (isHidden) {
        toast.success('Hidden guide created! Only accessible via access link - perfect for private sharing.');
      } else {
        toast.success('Published guide created! Discoverable on main page with payment required. Access link available for direct access.');
      }
      
      // Reset form
      setFormData({ title: '', description: '', city: '', country: '', category: 'Cultural Heritage', price: '12' });
      setSections([]);
      setUploadedImages([]);
      setIsHidden(false);
    } catch (error: any) {
      console.error('Error creating guide:', error);
      toast.error('Failed to create guide. Please try again.');
    } finally {
      setPublishLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-muted-foreground">You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 md:py-8 pb-safe">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-sm md:text-base">Comprehensive platform management and content creation</p>
        </div>

        <AdminMobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden md:grid grid-cols-5 w-full max-w-4xl gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="content-management" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>Content</span>
            </TabsTrigger>
            <TabsTrigger value="contact-management" className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <span>Contact</span>
            </TabsTrigger>
            <TabsTrigger value="create-guide" className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </TabsTrigger>
            <TabsTrigger value="edit-guide" className="flex items-center gap-2 text-sm" data-tab="edit-guide">
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>


          <TabsContent value="content-management">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
              <GuideManagement />
            </div>
          </TabsContent>

          <TabsContent value="contact-management">
            <AdminContactManagement />
          </TabsContent>


          <TabsContent value="create-guide">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold">Create Audio Guide</h2>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="publication-toggle" className="text-sm font-medium">
                    {isHidden ? 'Hidden' : 'Published'}
                  </Label>
                  <Switch
                    id="publication-toggle"
                    checked={!isHidden}
                    onCheckedChange={(checked) => setIsHidden(!checked)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isHidden ? 'Will be created as hidden (accessible via link only)' : 'Will be published publicly'}
                  </span>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Guide Information</CardTitle>
                  <CardDescription>Create a new audio guide with sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Guide Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Goreme Open Air Museum"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="description">Guide Description</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.description.length}/100
                        </span>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of the guide..."
                        maxLength={100}
                        className="mt-1 min-h-[60px]"
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
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate AI Description'
                        )}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cultural Heritage">Cultural Heritage</SelectItem>
                          <SelectItem value="Natural Wonder">Natural Wonder</SelectItem>
                          <SelectItem value="Historical">Historical</SelectItem>
                          <SelectItem value="Art & Culture">Art & Culture</SelectItem>
                          <SelectItem value="Architecture">Architecture</SelectItem>
                          <SelectItem value="Religious">Religious</SelectItem>
                          <SelectItem value="Modern Attraction">Modern Attraction</SelectItem>
                          <SelectItem value="Local Experience">Local Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <CountrySelector
                        value={formData.country}
                        onValueChange={(value) => handleInputChange('country', value)}
                        placeholder="Select country"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g., Cappadocia"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="12"
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Guide Images</Label>
                    <ImageUploader
                      onImagesUploaded={setUploadedImages}
                      currentImages={uploadedImages}
                      maxImages={5}
                    />
                  </div>

                  <AudioGuideSectionManager
                    sections={sections}
                    onSectionsChange={setSections}
                    guideId={tempGuideId}
                    guideTitle={formData.title}
                    location={`${formData.city}, ${formData.country}`}
                    category={formData.category}
                  />

                  {/* QR Code and Share Link Display */}
                  {createdGuide && qrCodeUrl && shareUrl && (
                    <>
                      <Separator />
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="text-green-800 flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            {isHidden ? 'Hidden Guide Created!' : 'Published Guide Created!'}
                          </CardTitle>
                          <CardDescription className="text-green-700">
                            {isHidden 
                              ? 'Guide is hidden from main page - only accessible via this access link'
                              : 'Guide is discoverable on main page with payment required - access link provides direct access'
                            }
                          </CardDescription>
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
                                <Label className="text-green-700 font-medium">
                                  {isHidden ? 'Direct Access Link' : 'Access Link (Bypass Payment)'}
                                </Label>
                                <div className="flex gap-2">
                                  <Input 
                                    value={shareUrl} 
                                    readOnly 
                                    className="bg-white text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(shareUrl, 'Access link')}
                                    className="shrink-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-green-600">
                                  {isHidden 
                                    ? 'Share this link for instant access to the hidden guide'
                                    : 'This link bypasses payment and provides instant access'
                                  }
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-green-700 font-medium">Guide Details</Label>
                                <div className="text-sm space-y-1">
                                  <p><strong>Title:</strong> {createdGuide.title}</p>
                                  <p><strong>Location:</strong> {createdGuide.location}</p>
                                  <p><strong>Price:</strong> ${(createdGuide.price_usd / 100).toFixed(2)}</p>
                                  <p><strong>Visibility:</strong> {isHidden ? 'Hidden (Link Only)' : 'Published (Main Page + Link)'}</p>
                                  <p><strong>Status:</strong> Approved & Ready</p>
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

                  <Button
                    onClick={createGuide}
                    disabled={publishLoading}
                    className="w-full"
                    size="lg"
                  >
                    {publishLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Guide...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Guide (Admin)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="edit-guide">
            <AdminGuideEditForm onBack={() => setActiveTab('content-management')} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;