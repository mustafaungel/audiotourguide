import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, BarChart3, Users, UserCheck, UserPlus, Plus, ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';
import { UserManagement } from '@/components/UserManagement';
import { AdminCreatorManagement } from '@/components/AdminCreatorManagement';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { AdminUserCreation } from '@/components/AdminUserCreation';
import { AdminCreatorCreation } from '@/components/AdminCreatorCreation';
import { AdminMobileNavigation } from '@/components/AdminMobileNavigation';
import { CountrySelector } from '@/components/CountrySelector';
import { AudioGuideSectionManager } from '@/components/AudioGuideSectionManager';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminPanel = () => {
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    country: '',
    category: 'Cultural Heritage',
    price: '12'
  });

  // Section management
  const [sections, setSections] = useState<any[]>([]);

  // Generation states
  const [imageLoading, setImageLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  
  // Generated content
  const [generatedImage, setGeneratedImage] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateImage = async () => {
    if (!formData.title || !formData.city || !formData.country) {
      toast({
        title: "Error",
        description: "Please fill in title, city, and country first.",
        variant: "destructive"
      });
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
      
      setGeneratedImage(data.image);
      toast({
        title: "Image Generated",
        description: "AI has created your guide image successfully.",
      });
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setImageLoading(false);
    }
  };

  const createGuide = async () => {
    if (!formData.title || !formData.city || !formData.country || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (sections.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one section to your guide.",
        variant: "destructive"
      });
      return;
    }

    setPublishLoading(true);
    
    try {
      // Insert the guide
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .insert({
          title: formData.title,
          location: `${formData.city}, ${formData.country}`,
          description: `Explore ${formData.title} in ${formData.city}, ${formData.country}`,
          category: formData.category,
          price_usd: parseInt(formData.price),
          creator_id: user?.id,
          currency: 'usd',
          languages: ['English'],
          difficulty: 'beginner',
          duration: sections.reduce((total, section) => total + (section.duration_seconds || 0), 0),
          is_published: true,
          is_approved: true, // Admin privilege
          image_url: generatedImage || null,
          sections: JSON.stringify(sections)
        })
        .select()
        .single();

      if (guideError) throw guideError;

      // Insert sections
      if (sections.length > 0) {
        const sectionsToInsert = sections.map(section => ({
          guide_id: guideData.id,
          title: section.title,
          description: section.description,
          audio_url: section.audio_url,
          duration_seconds: section.duration_seconds,
          language: section.language,
          order_index: section.order_index
        }));

        const { error: sectionsError } = await supabase
          .from('guide_sections')
          .insert(sectionsToInsert);

        if (sectionsError) throw sectionsError;
      }
      
      toast({
        title: "Guide Created",
        description: "Audio guide has been published successfully.",
      });
      
      // Reset form
      setFormData({ title: '', city: '', country: '', category: 'Cultural Heritage', price: '12' });
      setSections([]);
      setGeneratedImage('');
    } catch (error: any) {
      console.error('Error creating guide:', error);
      toast({
        title: "Error",
        description: "Failed to create guide. Please try again.",
        variant: "destructive"
      });
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
          <TabsList className="hidden md:grid grid-cols-3 lg:grid-cols-6 w-full max-w-4xl gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Users className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="creator-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <UserCheck className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Creators</span>
            </TabsTrigger>
            <TabsTrigger value="content-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="create-guide" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Create</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="user-management">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
                <Button onClick={() => document.getElementById('create-user-tab')?.click()}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New User
                </Button>
              </div>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserManagement />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminUserCreation />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="creator-management">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Creator Management</h2>
                <Button onClick={() => document.getElementById('create-creator-tab')?.click()}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Creator
                </Button>
              </div>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Creators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminCreatorManagement />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminCreatorCreation />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content-management">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
              <GuideManagement />
            </div>
          </TabsContent>

          <TabsContent value="create-guide">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Create Audio Guide</h2>

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

                  <div className="flex gap-4">
                    <Button
                      onClick={generateImage}
                      disabled={imageLoading || !formData.title || !formData.city || !formData.country}
                      variant="outline"
                    >
                      {imageLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate AI Image
                        </>
                      )}
                    </Button>
                  </div>

                  {generatedImage && (
                    <div className="space-y-2">
                      <Label>Generated Image</Label>
                      <img src={generatedImage} alt="Generated guide image" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}

                  <AudioGuideSectionManager
                    sections={sections}
                    onSectionsChange={setSections}
                  />

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

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;