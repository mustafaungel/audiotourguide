import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Volume2, Image, FileText, CheckCircle, BarChart3, Users, Settings, UserPlus, UserCheck, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';
import { UserManagement } from '@/components/UserManagement';
import { AdminCreatorManagement } from '@/components/AdminCreatorManagement';
import { AdminAIGuideGenerator } from '@/components/AdminAIGuideGenerator';
import { AudioUploader } from '@/components/AudioUploader';
import { AdminUserCreation } from '@/components/AdminUserCreation';
import { AdminCreatorCreation } from '@/components/AdminCreatorCreation';
import { AdminMobileNavigation } from '@/components/AdminMobileNavigation';
import { CountrySelector } from '@/components/CountrySelector';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminPanel = () => {
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'script' | 'audio' | 'image' | 'complete' | null>(null);
  const [generatedContent, setGeneratedContent] = useState({
    script: '',
    audioContent: '',
    imageContent: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    location: '',
    country: '',
    city: '',
    category: 'Cultural Heritage',
    duration: 45,
    difficulty: 'Easy',
    languages: ['English'],
    price: 12.00,
    tone: 'Professional yet engaging',
    bestTime: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateScript = async () => {
    try {
      setCurrentStep('script');
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          destination: formData.destination,
          category: formData.category,
          duration: formData.duration,
          tone: formData.tone,
          language: 'English'
        }
      });

      if (error) throw error;

      setGeneratedContent(prev => ({ ...prev, script: data.script }));
      toast({
        title: "Script Generated!",
        description: "AI has created your tour script successfully.",
      });
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        variant: "destructive",
        title: "Script Generation Failed",
        description: error.message,
      });
    }
  };

  const generateAudio = async () => {
    if (!generatedContent.script) {
      toast({
        variant: "destructive",
        title: "No Script Available",
        description: "Please generate a script first.",
      });
      return;
    }

    try {
      setCurrentStep('audio');
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: {
          text: generatedContent.script,
          voiceId: '9BWtsMINqrJLrRacOk9x', // Aria voice
          modelId: 'eleven_multilingual_v2',
          isPreview: false
        }
      });

      if (error) throw error;

      setGeneratedContent(prev => ({ ...prev, audioContent: data.audioContent }));
      toast({
        title: "Audio Generated!",
        description: "AI has created your tour audio successfully.",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        variant: "destructive",
        title: "Audio Generation Failed",
        description: error.message,
      });
    }
  };

  const generateImage = async () => {
    try {
      setCurrentStep('image');
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          destination: formData.destination,
          style: 'professional travel photography, cinematic lighting, vibrant colors'
        }
      });

      if (error) throw error;

      setGeneratedContent(prev => ({ ...prev, imageContent: data.imageContent }));
      toast({
        title: "Image Generated!",
        description: "AI has created your tour image successfully.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: error.message,
      });
    }
  };

  const publishGuide = async () => {
    try {
      setCurrentStep('complete');
      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category,
          duration: formData.duration,
          difficulty: formData.difficulty,
          languages: formData.languages,
          price_usd: Math.round(formData.price * 100), // Convert to cents
          script: generatedContent.script,
          audio_content: generatedContent.audioContent,
          image_content: generatedContent.imageContent,
          best_time: formData.bestTime
        }
      });

      if (error) throw error;

      toast({
        title: "Guide Created!",
        description: "Your audio guide has been submitted for approval.",
      });

      // Reset form
      setGeneratedContent({ script: '', audioContent: '', imageContent: '' });
      setCurrentStep(null);
    } catch (error) {
      console.error('Error publishing guide:', error);
      toast({
        variant: "destructive",
        title: "Publishing Failed",
        description: error.message,
      });
    }
  };

  const generateAll = async () => {
    setIsGenerating(true);
    try {
      await generateScript();
      await generateAudio();
      await generateImage();
      await publishGuide();
    } catch (error) {
      console.error('Error in generation pipeline:', error);
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
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
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-sm md:text-base">Comprehensive platform management and content creation</p>
        </div>

        <AdminMobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden md:grid grid-cols-4 lg:grid-cols-8 w-full max-w-6xl gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Users className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">User Mgmt</span>
            </TabsTrigger>
            <TabsTrigger value="creator-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <UserCheck className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Creator Mgmt</span>
            </TabsTrigger>
            <TabsTrigger value="content-management" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Wand2 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">AI Tools</span>
            </TabsTrigger>
            <TabsTrigger value="create-guide" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Create</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="audio-setup" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Volume2 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Audio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="user-management">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Management</h2>
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Creator Management</h2>
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
              <h2 className="text-2xl font-bold">Content Management</h2>
              <GuideManagement />
            </div>
          </TabsContent>

          <TabsContent value="ai-tools">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">AI Content Generation</h2>
              <AdminAIGuideGenerator />
            </div>
          </TabsContent>

          <TabsContent value="create-guide">
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Guide Information</CardTitle>
                <CardDescription>Basic details about your audio guide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Guide Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Ancient Rome: Colosseum & Forum"
                      className="mt-1 h-12"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                      <CountrySelector
                        value={formData.country}
                        onValueChange={(value) => handleInputChange('country', value)}
                        placeholder="Select country"
                        className="mt-1 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g., Rome"
                        className="mt-1 h-12"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the audio guide experience..."
                    rows={4}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="mt-1 h-12">
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
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="15"
                      max="120"
                      className="mt-1 h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      min="0"
                      className="mt-1 h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">AI Generation Pipeline</CardTitle>
                <CardDescription>Generate content with AI assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Button 
                    onClick={generateScript} 
                    disabled={isGenerating || !formData.country || !formData.city}
                    className="w-full h-12 text-base"
                  >
                    {currentStep === 'script' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Script...</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" /> Generate Script</>
                    )}
                  </Button>

                  <Button 
                    onClick={generateAudio} 
                    disabled={isGenerating || !generatedContent.script}
                    variant="outline"
                    className="w-full h-12 text-base"
                  >
                    {currentStep === 'audio' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Audio...</>
                    ) : (
                      <><Volume2 className="h-4 w-4 mr-2" /> Generate Audio</>
                    )}
                  </Button>

                  <Button 
                    onClick={generateImage} 
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full h-12 text-base"
                  >
                    {currentStep === 'image' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Image...</>
                    ) : (
                      <><Image className="h-4 w-4 mr-2" /> Generate Image</>
                    )}
                  </Button>

                  <div className="border-t pt-4">
                    <Button 
                      onClick={generateAll} 
                      disabled={isGenerating || !formData.title || !formData.country || !formData.city}
                      className="w-full h-14 text-base"
                      size="lg"
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Complete Guide...</>
                      ) : (
                        <><Wand2 className="h-4 w-4 mr-2" /> Generate Complete Guide</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {generatedContent.script ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={generatedContent.script ? 'text-green-600' : 'text-muted-foreground'}>
                    Script Generated
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {generatedContent.audioContent ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={generatedContent.audioContent ? 'text-green-600' : 'text-muted-foreground'}>
                    Audio Generated
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {generatedContent.imageContent ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={generatedContent.imageContent ? 'text-green-600' : 'text-muted-foreground'}>
                    Image Generated
                  </span>
                </div>
              </CardContent>
            </Card>

            {generatedContent.imageContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={`data:image/webp;base64,${generatedContent.imageContent}`}
                    alt="Generated guide image"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {generatedContent.audioContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Audio</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio 
                    controls 
                    className="w-full"
                    src={`data:audio/mpeg;base64,${generatedContent.audioContent}`}
                  />
                </CardContent>
              </Card>
            )}

            {generatedContent.script && generatedContent.audioContent && generatedContent.imageContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Publish</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={publishGuide} className="w-full" size="lg">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </CardContent>
              </Card>
            )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Coming soon - Advanced analytics and reporting</p>
            </div>
          </TabsContent>

          <TabsContent value="audio-setup">
            <AudioUploader />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;