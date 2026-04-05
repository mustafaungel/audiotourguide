import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminReviewManagement } from '@/components/AdminReviewManagement';
import AdminLanguageManagement from '@/components/AdminLanguageManagement';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, ImageIcon, Copy, QrCode, Edit2, Mail, Palette, BarChart3, Languages, Eye } from 'lucide-react';
import { ButtonLoader } from '@/components/AudioGuideLoader';
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
import { EnhancedEmailTesting } from '@/components/EnhancedEmailTesting';
import { AdminAnalyticsManager } from '@/components/AdminAnalyticsManager';
import { EnhancedLogoUploader } from '@/components/EnhancedLogoUploader';

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
    price: '0',
    is_featured: false
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
    if (!formData.title || !formData.city || !formData.country) {
      toast.error('Please fill in title, city, and country first.');
      return;
    }

    setDescriptionLoading(true);
    
    try {
      // Try the new generate-guide-description function first
      let { data, error } = await supabase.functions.invoke('generate-guide-description', {
        body: {
          title: formData.title,
          city: formData.city,
          country: formData.country,
          category: formData.category || 'cultural'
        }
      });

      // Fallback to the old function if the new one fails
      if (error || !data?.description) {
        console.log('Trying fallback description function...');
        const fallbackResult = await supabase.functions.invoke('generate-description', {
          body: {
            title: formData.title,
            city: formData.city,
            country: formData.country,
            category: formData.category || 'cultural'
          }
          
        });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error generating description:', error);
        toast.error(`Failed to generate description: ${error.message || 'Unknown error'}`);
        return;
      }
      
      if (data?.description) {
        handleInputChange('description', data.description);
        toast.success('AI has created your guide description successfully.');
      } else {
        toast.error('No description returned from AI');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast.error(`Failed to generate description: ${error.message || 'Network error'}`);
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
    // Enhanced validation with specific error messages
    const missingFields = [];
    if (!formData.title?.trim()) missingFields.push('Title');
    if (!formData.city?.trim()) missingFields.push('City');
    if (!formData.country?.trim()) missingFields.push('Country');
    if (!formData.category?.trim()) missingFields.push('Category');

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      console.error('Missing required fields:', missingFields);
      return;
    }

    // Validate price is a valid number (allow free guides)
    const priceValue = formData.price?.trim() ? parseFloat(formData.price) * 100 : 0; // Convert dollars to cents
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Please enter a valid price (0 or greater for free guides)');
      return;
    }

    // Sections are optional - guides can be created without sections
    if (sections.length > 0) {
      // Validate sections have at least a title
      const invalidSections = sections.filter((section, index) => 
        !section.title?.trim()
      );
      
      if (invalidSections.length > 0) {
        toast.error('All sections must have at least a title');
        return;
      }
    }

    setPublishLoading(true);
    
    try {
      // Prepare payload with trimmed values
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || `Explore ${formData.title.trim()} in ${formData.city.trim()}, ${formData.country.trim()}`,
        location: `${formData.city.trim()}, ${formData.country.trim()}`,
        category: formData.category.trim(),
        price_usd: priceValue,
        difficulty: 'intermediate',
        languages: ['English'],
        sections: sections.map(section => ({
          ...section,
          title: section.title?.trim(),
          description: section.description?.trim() || section.content?.trim() || ''
        })),
        image_urls: uploadedImages,
        is_published: !isHidden,
        is_featured: formData.is_featured,
        generate_audio: true
      };

      console.log('Creating guide with payload:', payload);
      
      // Use the create-guide edge function for consistency
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: payload
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error details:', error);
        // Try to extract more specific error message
        const errorMessage = error.message || error.details || error.hint || 'Unknown error occurred';
        toast.error(`Failed to create guide: ${errorMessage}`);
        return;
      }

      if (!data || !data.guide) {
        console.error('Invalid response from edge function:', data);
        toast.error('Invalid response from server. Please try again.');
        return;
      }

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
      setFormData({ title: '', description: '', city: '', country: '', category: 'Cultural Heritage', price: '0', is_featured: false });
      setSections([]);
      setUploadedImages([]);
      setIsHidden(false);
      
      console.log('Guide created successfully:', data.guide.id);
      
    } catch (error: any) {
      console.error('Error creating guide - full error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to create guide. Please try again.';
      
      if (error.message) {
        errorMessage = `Failed to create guide: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Failed to create guide: ${error}`;
      } else if (error.details) {
        errorMessage = `Failed to create guide: ${error.details}`;
      }
      
      // Network error handling
      if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
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
          <TabsList className="hidden md:grid grid-cols-9 w-full max-w-6xl gap-1">
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
            <TabsTrigger value="email-test" className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="review-management" className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="create-guide" className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </TabsTrigger>
            <TabsTrigger value="edit-guide" className="flex items-center gap-2 text-sm" data-tab="edit-guide">
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="language-management" className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4" />
              <span>Languages</span>
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

          <TabsContent value="email-test">
            <EnhancedEmailTesting />
          </TabsContent>

          <TabsContent value="review-management">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
              <AdminReviewManagement />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsManager />
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
                          <ButtonLoader text="Generating..." />
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
                      placeholder="9.99"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set your guide price. Recommended: $3-15 for most guides
                    </p>
                  </div>

                  {/* Featured Toggle */}
                  <div>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Featured guides appear prominently on the homepage and get more visibility.
                    </p>
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
                      <ButtonLoader text="Creating Guide..." />
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

          <TabsContent value="language-management">
            <AdminLanguageManagement />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;