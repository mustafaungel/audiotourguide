import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSiteBranding } from '@/hooks/useSiteBranding';
import { ResponsiveLogo } from '@/components/ResponsiveLogo';
import { AILogoGenerator } from '@/components/AILogoGenerator';
import { Upload, Eye, Trash2, Monitor, Smartphone, Palette } from 'lucide-react';
import logosCultural from '@/assets/logo-cultural-heritage.png';
import logosPremium from '@/assets/logo-premium-badge.png';
import logosCompass from '@/assets/logo-audio-compass.png';

interface LogoConcept {
  id: string;
  name: string;
  description: string;
  image: string;
  theme: 'modern' | 'premium' | 'cultural';
  colors: string[];
}

const LOGO_CONCEPTS: LogoConcept[] = [
  {
    id: 'cultural',
    name: 'Cultural Heritage',
    description: 'Audio waves with ancient architectural elements',
    image: logosCultural,
    theme: 'cultural',
    colors: ['#0F766E', '#D97706']
  },
  {
    id: 'premium',
    name: 'Premium Badge',
    description: 'Circular emblem with compass rose pattern',
    image: logosPremium,
    theme: 'premium',
    colors: ['#1E3A8A', '#B45309']
  },
  {
    id: 'compass',
    name: 'Audio Compass',
    description: 'Geometric compass with equalizer elements',
    image: logosCompass,
    theme: 'modern',
    colors: ['#7C3AED', '#0EA5E9']
  }
];

export const AdminBrandingManager: React.FC = () => {
  const { branding, loading, updateBranding } = useSiteBranding();
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState(branding.companyName);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [previewSize, setPreviewSize] = useState<'sm' | 'md' | 'lg'>('md');

  const handleConceptSelect = async (concept: LogoConcept) => {
    setSelectedConcept(concept.id);
    const success = await updateBranding('site_logo_url', concept.image);
    if (success) {
      toast.success(`Applied ${concept.name} logo concept`);
    } else {
      toast.error('Failed to update logo');
    }
  };

  const handleCustomLogoUpload = async () => {
    if (!customLogoUrl.trim()) {
      toast.error('Please enter a logo URL');
      return;
    }
    
    const success = await updateBranding('site_logo_url', customLogoUrl);
    if (success) {
      toast.success('Custom logo uploaded successfully');
      setCustomLogoUrl('');
    } else {
      toast.error('Failed to upload custom logo');
    }
  };

  const handleCompanyNameUpdate = async () => {
    const success = await updateBranding('company_name', companyName);
    if (success) {
      toast.success('Company name updated successfully');
    } else {
      toast.error('Failed to update company name');
    }
  };

  const removeLogo = async () => {
    const success = await updateBranding('site_logo_url', null);
    if (success) {
      toast.success('Logo removed successfully');
      setSelectedConcept(null);
    } else {
      toast.error('Failed to remove logo');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Logo Preview
          </CardTitle>
          <CardDescription>
            See how your logo appears across different contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Size Controls */}
            <div className="flex items-center gap-4">
              <Label>Preview Size:</Label>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={previewSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewSize(size)}
                  >
                    {size.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Desktop Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Desktop Navigation</span>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <ResponsiveLogo size={previewSize} variant="full" />
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Mobile Navigation</span>
              </div>
              <div className="p-4 border rounded-lg bg-card max-w-sm">
                <ResponsiveLogo size={previewSize} variant="compact" />
              </div>
            </div>

            {/* Icon Only Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Icon Only</span>
              </div>
              <div className="p-4 border rounded-lg bg-card w-fit">
                <ResponsiveLogo size={previewSize} variant="icon-only" showCompanyName={false} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Management */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Management</CardTitle>
          <CardDescription>
            Choose from professional logo concepts or upload your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ai-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai-generator">AI Generator</TabsTrigger>
              <TabsTrigger value="concepts">Logo Concepts</TabsTrigger>
              <TabsTrigger value="custom">Custom Upload</TabsTrigger>
              <TabsTrigger value="settings">Brand Settings</TabsTrigger>
            </TabsList>

        <TabsContent value="ai-generator" className="space-y-6">
          <AILogoGenerator />
        </TabsContent>

        <TabsContent value="concepts" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {LOGO_CONCEPTS.map((concept) => (
                  <Card 
                    key={concept.id}
                    className={`cursor-pointer transition-all ${
                      selectedConcept === concept.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleConceptSelect(concept)}
                  >
                    <CardHeader className="pb-2">
                      <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                        <img 
                          src={concept.image} 
                          alt={concept.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-lg">{concept.name}</CardTitle>
                      <CardDescription>{concept.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          <span className="text-sm font-medium">Colors:</span>
                        </div>
                        <div className="flex gap-2">
                          {concept.colors.map((color) => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Badge variant={concept.theme === 'modern' ? 'default' : 'secondary'}>
                          {concept.theme}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-logo">Custom Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-logo"
                      placeholder="https://example.com/your-logo.png"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                    />
                    <Button onClick={handleCustomLogoUpload}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Logo Requirements:</p>
                  <ul className="space-y-1 pl-4 list-disc">
                    <li>PNG or JPG format recommended</li>
                    <li>Minimum width: 200px for crisp display</li>
                    <li>Transparent background preferred</li>
                    <li>Horizontal orientation works best</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Button onClick={handleCompanyNameUpdate}>
                      Update
                    </Button>
                  </div>
                </div>

                {branding.logoUrl && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={removeLogo}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Current Logo
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};