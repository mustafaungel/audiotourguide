import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Bot, 
  MapPin, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Loader2,
  Play,
  Download,
  Eye
} from 'lucide-react';

interface GeneratedGuide {
  title: string;
  description: string;
  content: string;
  estimated_duration: number;
  suggested_price: number;
  category: string;
  difficulty: string;
  highlights: string[];
}

export const AdminAIGuideGenerator = () => {
  const { userProfile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    theme: '',
    target_audience: '',
    duration_preference: '',
    special_requirements: ''
  });
  const [generatedGuide, setGeneratedGuide] = useState<GeneratedGuide | null>(null);

  // Only allow admins to access this component
  if (userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            This feature is only available to administrators.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (!formData.location || !formData.theme) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide at least a location and theme."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-guide', {
        body: formData
      });

      if (error) throw error;

      setGeneratedGuide(data.guide);
      toast({
        title: "Guide Generated!",
        description: "AI has generated your audio guide content."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate AI guide. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateGuide = async () => {
    if (!generatedGuide) return;

    setIsCreating(true);
    try {
      // Create the audio guide in the database
      const { data: guide, error } = await supabase
        .from('audio_guides')
        .insert({
          creator_id: userProfile.user_id,
          title: generatedGuide.title,
          description: generatedGuide.description,
          location: formData.location,
          category: generatedGuide.category,
          price_usd: Math.round(generatedGuide.suggested_price * 100), // Convert to cents
          duration: generatedGuide.estimated_duration,
          difficulty: generatedGuide.difficulty,
          languages: ['English'],
          is_approved: true, // Admin-created guides are auto-approved
          is_published: false, // Let admin choose when to publish
          transcript: generatedGuide.content,
          slug: generatedGuide.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Generate actual audio file
      const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
        body: {
          text: generatedGuide.content,
          guide_id: guide.id
        }
      });

      if (audioError) {
        console.warn('Audio generation failed:', audioError);
        toast({
          title: "Guide Created",
          description: "Guide created successfully, but audio generation is pending."
        });
      } else {
        toast({
          title: "Success!",
          description: "AI guide has been created with audio. You can now publish it."
        });
      }

      // Reset form
      setGeneratedGuide(null);
      setFormData({
        location: '',
        theme: '',
        target_audience: '',
        duration_preference: '',
        special_requirements: ''
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Failed to create the guide. Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-tourism-warm/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-tourism-warm" />
            AI Audio Guide Generator
          </CardTitle>
          <CardDescription>
            Create professional audio guides using AI. This feature is exclusive to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generatedGuide ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Paris, France or Statue of Liberty"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme/Focus *</Label>
                  <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="historical">Historical Exploration</SelectItem>
                      <SelectItem value="cultural">Cultural Immersion</SelectItem>
                      <SelectItem value="culinary">Food & Cuisine</SelectItem>
                      <SelectItem value="architectural">Architecture & Design</SelectItem>
                      <SelectItem value="artistic">Art & Museums</SelectItem>
                      <SelectItem value="nature">Nature & Wildlife</SelectItem>
                      <SelectItem value="spiritual">Spiritual & Religious</SelectItem>
                      <SelectItem value="adventure">Adventure & Activities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Who is this for?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Tourists</SelectItem>
                      <SelectItem value="families">Families with Children</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                      <SelectItem value="solo">Solo Travelers</SelectItem>
                      <SelectItem value="seniors">Senior Citizens</SelectItem>
                      <SelectItem value="students">Students & Young Adults</SelectItem>
                      <SelectItem value="professionals">Business Travelers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Preferred Duration
                  </Label>
                  <Select value={formData.duration_preference} onValueChange={(value) => setFormData({ ...formData, duration_preference: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="How long should it be?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (15-30 minutes)</SelectItem>
                      <SelectItem value="medium">Medium (30-60 minutes)</SelectItem>
                      <SelectItem value="long">Long (60-90 minutes)</SelectItem>
                      <SelectItem value="extended">Extended (90+ minutes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Any specific topics, accessibility needs, or unique angles to cover..."
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{generatedGuide.title}</h3>
                    <p className="text-muted-foreground">{generatedGuide.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-tourism-warm/10 text-tourism-warm">
                    AI Generated
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-background rounded border">
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">{generatedGuide.estimated_duration} min</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded border">
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">${generatedGuide.suggested_price}</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded border">
                    <div className="text-xs font-medium uppercase">{generatedGuide.category}</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded border">
                    <div className="text-xs font-medium uppercase">{generatedGuide.difficulty}</div>
                  </div>
                </div>

                {generatedGuide.highlights && generatedGuide.highlights.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Key Highlights:</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedGuide.highlights.map((highlight, index) => (
                        <Badge key={index} variant="outline">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-background p-4 rounded border">
                  <h4 className="font-medium mb-2">Generated Content Preview:</h4>
                  <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {generatedGuide.content.substring(0, 500)}...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!generatedGuide ? (
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !formData.location || !formData.theme}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate AI Guide'}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleCreateGuide}
                  disabled={isCreating}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? 'Creating...' : 'Create Guide'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setGeneratedGuide(null)}
                >
                  Generate New
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-accent mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">AI Guide Generation</p>
            <p className="text-muted-foreground">
              This feature uses advanced AI to create professional audio guide content. 
              Guides generated here are automatically approved and can be published immediately. 
              The AI considers location context, target audience, and cultural sensitivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};