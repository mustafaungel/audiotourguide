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
import { Loader2, Wand2, Volume2, Image, FileText, CheckCircle, BarChart3, Users, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';
import { UserManagement } from '@/components/UserManagement';
import { AdminCreatorManagement } from '@/components/AdminCreatorManagement';
import { AdminAIGuideGenerator } from '@/components/AdminAIGuideGenerator';

const AdminPanel = () => {
  const { user, userProfile } = useAuth();
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Comprehensive platform management and content creation</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="ai-guides" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Guides
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="guides">
            <GuideManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="creators">
            <AdminCreatorManagement />
          </TabsContent>

          <TabsContent value="ai-guides">
            <AdminAIGuideGenerator />
          </TabsContent>

          <TabsContent value="create">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guide Information</CardTitle>
                <CardDescription>Basic details about your audio guide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Guide Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Ancient Rome: Colosseum & Forum"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      placeholder="e.g., Rome, Italy"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the audio guide experience..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
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
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="15"
                      max="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Generation Pipeline</CardTitle>
                <CardDescription>Generate content with AI assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Button 
                    onClick={generateScript} 
                    disabled={isGenerating || !formData.destination}
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
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
                      disabled={isGenerating || !formData.title || !formData.destination}
                      className="w-full"
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;