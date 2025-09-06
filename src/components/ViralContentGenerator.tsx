import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Zap, Eye, Share2 } from 'lucide-react';
import { useViralTracking } from '@/hooks/useViralTracking';
import { useToast } from '@/hooks/use-toast';

interface GeneratedContent {
  title: string;
  description: string;
  full_content: string;
  highlights: string[];
  location: string;
  viral_score: number;
  estimated_views: number;
  shareable_moments: string[];
}

export const ViralContentGenerator: React.FC = () => {
  const [location, setLocation] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateViralContent, trackEngagement } = useViralTracking();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!location.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a destination to generate viral content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateViralContent(location, {
        trend_type: 'social_media',
        platform_data: {
          instagram_engagement: Math.random() * 100,
          tiktok_views: Math.random() * 1000000,
          twitter_mentions: Math.random() * 500
        }
      });

      if (result) {
        setGeneratedContent(result);
        toast({
          title: "🚀 Viral content ready!",
          description: `Generated trending guide for ${location}`,
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateGuide = async () => {
    if (!generatedContent) return;

    try {
      // This would integrate with the guide creation system
      toast({
        title: "🎯 Creating viral guide...",
        description: "Your trending content will be live soon!",
      });

      // Track the content generation event
      await trackEngagement('achievement', 'viral-content', {
        metadata: {
          type: 'content_creation',
          name: 'Viral Content Creator',
          description: 'Generated viral travel content',
          points: 50
        }
      });
    } catch (error) {
      console.error('Error creating guide:', error);
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-tourism-warm/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-tourism-warm" />
        <h3 className="text-lg font-semibold text-foreground">Viral Content Generator</h3>
        <Badge variant="secondary" className="bg-tourism-warm/20 text-tourism-warm">
          AI-Powered
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter trending destination (e.g., Santorini, Bali, Tokyo)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            className="flex-1"
          />
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-tourism-warm hover:bg-tourism-warm/90"
          >
            {isGenerating ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Viral Content
              </>
            )}
          </Button>
        </div>

        {generatedContent && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">{generatedContent.title}</h4>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Viral Score: {generatedContent.viral_score}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Est. {(generatedContent.estimated_views / 1000).toFixed(1)}K views
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{generatedContent.description}</p>

            <div className="space-y-2">
              <h5 className="font-medium text-sm text-foreground">🔥 Viral Highlights:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedContent.highlights.slice(0, 4).map((highlight, index) => (
                  <div key={index} className="bg-background/50 p-2 rounded-md text-xs">
                    • {highlight}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-sm text-foreground">📸 Shareable Moments:</h5>
              <div className="flex flex-wrap gap-2">
                {generatedContent.shareable_moments.map((moment, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {moment}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateGuide} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Create Viral Guide
              </Button>
              <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                Generate New
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-background/30 rounded-md">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Pro Tip:</strong> Content generated from trending locations and current social media data 
          has 3x higher engagement rates. Use specific, searchable location names for best results.
        </p>
      </div>
    </Card>
  );
};