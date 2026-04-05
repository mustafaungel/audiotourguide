import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoGenerationService, LogoGenerationOptions } from '@/services/logoGenerationService';
import { Wand2, Sparkles } from 'lucide-react';
import { ButtonLoader } from '@/components/AudioGuideLoader';
import { toast } from 'sonner';

export const AILogoGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<LogoGenerationOptions>({
    style: 'modern',
    theme: 'audio-tour'
  });

  const handleGenerateLogo = async () => {
    try {
      setIsGenerating(true);
      await LogoGenerationService.generateAndImplementLogo(options);
    } catch (error) {
      console.error('Logo generation failed:', error);
      // Error is already handled in the service with toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          AI Logo Generator
        </CardTitle>
        <CardDescription>
          Generate a custom logo for your audio tour platform using AI. The logo will be automatically 
          processed, uploaded, and implemented across your entire website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <Select 
              value={options.style} 
              onValueChange={(value: 'modern' | 'classic' | 'minimal') => 
                setOptions(prev => ({ ...prev, style: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <Select 
              value={options.theme} 
              onValueChange={(value: 'audio-tour' | 'travel' | 'tech') => 
                setOptions(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audio-tour">Audio Tour</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            What happens when you generate:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• AI creates a custom logo based on your preferences</li>
            <li>• Background is automatically removed for transparency</li>
            <li>• Logo is optimized for both light and dark themes</li>
            <li>• Favicon is generated and updated in your browser</li>
            <li>• All components update immediately with your new branding</li>
          </ul>
        </div>

        <Button 
          onClick={handleGenerateLogo}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <ButtonLoader text="Generating Your Logo..." />
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Custom Logo
            </>
          )}
        </Button>

        {isGenerating && (
          <div className="text-center text-sm text-muted-foreground">
            This may take 30-60 seconds. Please don't close this tab.
          </div>
        )}
      </CardContent>
    </Card>
  );
};