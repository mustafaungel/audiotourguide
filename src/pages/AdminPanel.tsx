import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, ScrollText, AudioLines, Zap, Upload, BarChart3, Users, UserCheck, UserPlus, Plus } from 'lucide-react';
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
    duration: '45',
    price: '12'
  });

  // Generation states
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  
  // Generated content
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState('');
  
  // Error states
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.city || !formData.country || !formData.category || !formData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields first.",
        variant: "destructive"
      });
      return;
    }

    setDescriptionLoading(true);
    setDescriptionError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          title: formData.title,
          country: formData.country,
          city: formData.city,
          category: formData.category,
          duration: parseInt(formData.duration)
        }
      });

      if (error) throw error;
      
      setGeneratedDescription(data.description);
      toast({
        title: "Description Generated",
        description: "AI has created your guide description successfully.",
      });
    } catch (error: any) {
      console.error('Error generating description:', error);
      setDescriptionError(error.message || 'Failed to generate description');
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDescriptionLoading(false);
    }
  };

  const generateScript = async () => {
    if (!generatedDescription) {
      toast({
        title: "Error",
        description: "Please generate description first.",
        variant: "destructive"
      });
      return;
    }

    setScriptLoading(true);
    setScriptError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          destination: `${formData.city}, ${formData.country}`,
          category: formData.category,
          duration: parseInt(formData.duration),
          tone: 'professional',
          language: 'English'
        }
      });

      if (error) throw error;
      
      setGeneratedScript(data.script);
      toast({
        title: "Script Generated",
        description: "Audio guide script has been generated successfully.",
      });
    } catch (error: any) {
      console.error('Error generating script:', error);
      setScriptError(error.message || 'Failed to generate script');
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setScriptLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!generatedScript) {
      toast({
        title: "Error",
        description: "Please generate script first.",
        variant: "destructive"
      });
      return;
    }

    setAudioLoading(true);
    setAudioError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: {
          text: generatedScript,
          voice: 'alloy'
        }
      });

      if (error) throw error;
      
      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Audio Generated",
        description: "Audio file has been generated successfully.",
      });
    } catch (error: any) {
      console.error('Error generating audio:', error);
      setAudioError(error.message || 'Failed to generate audio');
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAudioLoading(false);
    }
  };

  const publishGuide = async () => {
    if (!generatedDescription || !generatedScript || !generatedAudio) {
      toast({
        title: "Error",
        description: "Please complete all generation steps first.",
        variant: "destructive"
      });
      return;
    }

    setPublishLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: {
          title: formData.title,
          location: `${formData.city}, ${formData.country}`,
          description: generatedDescription,
          category: formData.category,
          duration: parseInt(formData.duration),
          price_usd: parseInt(formData.price),
          script: generatedScript,
          audio_url: generatedAudio,
          image_url: null
        }
      });

      if (error) throw error;
      
      toast({
        title: "Guide Published",
        description: "Audio guide has been submitted for approval.",
      });
      
      // Reset form
      setFormData({ title: '', city: '', country: 'Cultural Heritage', category: 'Cultural Heritage', duration: '45', price: '12' });
      setGeneratedDescription('');
      setGeneratedScript('');
      setGeneratedAudio('');
    } catch (error: any) {
      console.error('Error publishing guide:', error);
      toast({
        title: "Error",
        description: "Failed to publish guide. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const generateAll = async () => {
    // Validate form first
    if (!formData.title || !formData.city || !formData.country || !formData.category || !formData.duration || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Step 1: Generate description
      if (!generatedDescription) {
        await generateDescription();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Step 2: Generate script
      if (generatedDescription && !generatedScript) {
        await generateScript();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Step 3: Generate audio
      if (generatedScript && !generatedAudio) {
        await generateAudio();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Step 4: Publish
      if (generatedAudio) {
        await publishGuide();
      }
    } catch (error) {
      console.error('Error in generate all:', error);
      toast({
        title: "Error",
        description: "Failed to complete generation pipeline.",
        variant: "destructive"
      });
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

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Guide Information</CardTitle>
                      <CardDescription>Fill in the basic details for your audio guide</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                      
                      <div className="grid grid-cols-2 gap-3">
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cultural Heritage">Cultural Heritage</SelectItem>
                              <SelectItem value="UNESCO Heritage">UNESCO Heritage</SelectItem>
                              <SelectItem value="Art & Museums">Art & Museums</SelectItem>
                              <SelectItem value="Archaeological Site">Archaeological Site</SelectItem>
                              <SelectItem value="Natural Wonders">Natural Wonders</SelectItem>
                              <SelectItem value="Island Heritage">Island Heritage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration (min)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            min="15"
                            max="120"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          min="0"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Generation Section */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Generation Pipeline</CardTitle>
                      <CardDescription>Generate content with AI assistance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          onClick={generateDescription}
                          disabled={!formData.title || !formData.city || !formData.country || !formData.category || !formData.duration || descriptionLoading}
                          className="w-full"
                        >
                          {descriptionLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              1. Generate Description
                            </>
                          )}
                        </Button>

                        <Button 
                          onClick={generateScript}
                          disabled={!generatedDescription || scriptLoading}
                          className="w-full"
                          variant={generatedDescription ? "default" : "secondary"}
                        >
                          {scriptLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ScrollText className="w-4 h-4 mr-2" />
                              2. Generate Script
                            </>
                          )}
                        </Button>

                        <Button 
                          onClick={generateAudio}
                          disabled={!generatedScript || audioLoading}
                          className="w-full"
                          variant={generatedScript ? "default" : "secondary"}
                        >
                          {audioLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <AudioLines className="w-4 h-4 mr-2" />
                              3. Generate Audio
                            </>
                          )}
                        </Button>

                        <div className="border-t pt-3 space-y-2">
                          <Button 
                            onClick={generateAll}
                            disabled={!formData.title || !formData.city || !formData.country || !formData.category || !formData.duration || descriptionLoading || scriptLoading || audioLoading}
                            className="w-full"
                            variant="destructive"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate All & Publish
                          </Button>

                          <Button 
                            onClick={publishGuide}
                            disabled={!generatedDescription || !generatedScript || !generatedAudio || publishLoading}
                            className="w-full"
                            variant="outline"
                          >
                            {publishLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Publish Guide
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Content Previews */}
                  {generatedDescription && (
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 flex items-center text-sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Description ✓
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">{generatedDescription}</p>
                      </div>
                    </div>
                  )}

                  {generatedScript && (
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2 flex items-center text-sm">
                        <ScrollText className="w-4 h-4 mr-2" />
                        Script ✓
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{generatedScript.substring(0, 100)}...</p>
                    </div>
                  )}

                  {generatedAudio && (
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2 flex items-center text-sm">
                        <AudioLines className="w-4 h-4 mr-2" />
                        Audio ✓
                      </h4>
                      <audio controls className="w-full h-8">
                        <source src={generatedAudio} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>
              </div>
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