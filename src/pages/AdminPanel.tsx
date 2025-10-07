import React, { useState, useEffect } from 'react';
import { AdminReviewManagement } from '@/components/AdminReviewManagement';
import AdminLanguageManagement from '@/components/AdminLanguageManagement';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText, Plus, ImageIcon, Copy, QrCode, Edit2, Mail, Palette, BarChart3, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateGuideQRCode, updateGuideWithQRCode } from '@/utils/admin/qrCode';
import { validateGuideForm, validatePrice, validateSections } from '@/utils/admin/validation';
import { showSuccessToast, showErrorToast, showGuideCreatedToast, showValidationErrorToast, copyToClipboard } from '@/utils/admin/toast';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { KeyboardShortcutsHelp } from '@/components/admin/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AdminMobileNavigation } from '@/components/AdminMobileNavigation';
import { CountrySelector } from '@/components/CountrySelector';
import { AudioGuideSectionManager } from '@/components/AudioGuideSectionManager';
import { AdminGuideEditForm } from '@/components/AdminGuideEditForm';
import { AdminContactManagement } from '@/components/AdminContactManagement';
import { EnhancedEmailTesting } from '@/components/EnhancedEmailTesting';
import { AdminAnalyticsManager } from '@/components/AdminAnalyticsManager';
import { EnhancedLogoUploader } from '@/components/EnhancedLogoUploader';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { ImageUploader } from '@/components/ImageUploader';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminPanel = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Listen for tab change events from GuideManagement
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('admin-tab-change', handleTabChange as EventListener);
    return () => window.removeEventListener('admin-tab-change', handleTabChange as EventListener);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', meta: true, handler: () => setActiveTab('create-guide'), description: 'Create new guide' },
    { key: 'd', meta: true, handler: () => setActiveTab('dashboard'), description: 'Go to dashboard' },
    { key: 'a', meta: true, handler: () => setActiveTab('analytics'), description: 'Go to analytics' },
    { key: 'e', meta: true, handler: () => setActiveTab('edit-guide'), description: 'Edit guide' },
    { key: '?', meta: true, handler: () => setShowShortcutsHelp(true), description: 'Show shortcuts' },
  ]);

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
      showErrorToast('Please fill in title, city, and country first.');
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
        showSuccessToast('AI has created your guide image successfully.');
      } else {
        throw new Error('No image received');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      showErrorToast('Failed to generate image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.city || !formData.country) {
      showErrorToast('Please fill in title, city, and country first.');
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
        showErrorToast(`Failed to generate description: ${error.message || 'Unknown error'}`);
        return;
      }
      
      if (data?.description) {
        handleInputChange('description', data.description);
        showSuccessToast('AI has created your guide description successfully.');
      } else {
        showErrorToast('No description returned from AI');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      showErrorToast(`Failed to generate description: ${error.message || 'Network error'}`);
    } finally {
      setDescriptionLoading(false);
    }
  };

  const generateQRCodeAndShareLink = async (guideId: string) => {
    try {
      const { qrCodeUrl, shareUrl } = await generateGuideQRCode(guideId);
      await updateGuideWithQRCode(guideId, qrCodeUrl, shareUrl);
      setQrCodeUrl(qrCodeUrl);
      setShareUrl(shareUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const createGuide = async () => {
    // Validate form data
    const validation = validateGuideForm(formData);
    if (!validation.isValid) {
      showValidationErrorToast(validation.errors);
      console.error('Missing required fields:', validation.errors);
      return;
    }

    // Validate price
    const priceValidation = validatePrice(formData.price);
    if (!priceValidation.isValid) {
      showErrorToast(priceValidation.error!);
      return;
    }

    // Validate sections
    const sectionsValidation = validateSections(sections);
    if (!sectionsValidation.isValid) {
      showErrorToast(sectionsValidation.error!);
      return;
    }

    setPublishLoading(true);
    
    try {
      // Prepare payload with trimmed values
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || `Explore ${formData.title.trim()} in ${formData.city.trim()}, ${formData.country.trim()}`,
        location: `${formData.city.trim()}, ${formData.country.trim()}`,
        category: formData.category.trim(),
        price_usd: priceValidation.value!,
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
        const errorMessage = error.message || error.details || error.hint || 'Unknown error occurred';
        showErrorToast(`Failed to create guide: ${errorMessage}`);
        return;
      }

      if (!data || !data.guide) {
        console.error('Invalid response from edge function:', data);
        showErrorToast('Invalid response from server. Please try again.');
        return;
      }

      setCreatedGuide(data.guide);
      setQrCodeUrl(data.guide.qr_code_url);
      setShareUrl(data.guide.share_url);
      
      showGuideCreatedToast(isHidden);
      
      // Reset form
      setFormData({ title: '', description: '', city: '', country: '', category: 'Cultural Heritage', price: '0', is_featured: false });
      setSections([]);
      setUploadedImages([]);
      setIsHidden(false);
      
      console.log('Guide created successfully:', data.guide.id);
      
    } catch (error: any) {
      console.error('Error creating guide - full error:', error);
      
      let errorMessage = 'Failed to create guide. Please try again.';
      if (error.message) {
        errorMessage = `Failed to create guide: ${error.message}`;
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showErrorToast(errorMessage);
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <AdminGuard>
      <AdminErrorBoundary>
        <Navigation />
        
        {isMobile ? (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 md:py-8 pb-safe">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Panel</h1>
                <p className="text-muted-foreground text-sm md:text-base">Comprehensive platform management and content creation</p>
              </div>

              <AdminMobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="mt-6">
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'content-management' && (
                  <div className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
                    <GuideManagement />
                  </div>
                )}
                {activeTab === 'contact-management' && <AdminContactManagement />}
                {activeTab === 'email-test' && <EnhancedEmailTesting />}
                {activeTab === 'review-management' && (
                  <div className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
                    <AdminReviewManagement />
                  </div>
                )}
                {activeTab === 'analytics' && <AdminAnalyticsManager />}
                {activeTab === 'create-guide' && (
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
                )}
                {activeTab === 'edit-guide' && <AdminGuideEditForm onBack={() => setActiveTab('content-management')} />}
                {activeTab === 'language-management' && <AdminLanguageManagement />}
                {activeTab === 'branding' && <EnhancedLogoUploader />}
              </div>
            </div>
          </div>
        ) : (
          <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'content-management' && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
                <GuideManagement />
              </div>
            )}
            {activeTab === 'contact-management' && <AdminContactManagement />}
            {activeTab === 'email-test' && <EnhancedEmailTesting />}
            {activeTab === 'review-management' && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
                <AdminReviewManagement />
              </div>
            )}
            {activeTab === 'analytics' && <AdminAnalyticsManager />}
            {activeTab === 'create-guide' && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Guide</CardTitle>
                  <CardDescription>Use the mobile view or create guide form here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Guide creation form will appear here. For now, use mobile view or the old interface.</p>
                </CardContent>
              </Card>
            )}
            {activeTab === 'edit-guide' && <AdminGuideEditForm onBack={() => setActiveTab('content-management')} />}
            {activeTab === 'language-management' && <AdminLanguageManagement />}
            {activeTab === 'branding' && <EnhancedLogoUploader />}
            {activeTab === 'destination-management' && (
              <Card>
                <CardHeader>
                  <CardTitle>Destination Management</CardTitle>
                  <CardDescription>Manage travel destinations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Destination management will appear here.</p>
                </CardContent>
              </Card>
            )}
          </AdminLayout>
        )}

        <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
      </AdminErrorBoundary>
    </AdminGuard>
  );
};

export default AdminPanel;