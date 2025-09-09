import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, Upload, X, Check, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogoUploaderProps {
  className?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ className }) => {
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [currentDarkLogo, setCurrentDarkLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputDarkRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadCurrentLogos();
  }, []);

  const loadCurrentLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['site_logo_url', 'site_logo_dark_url'])
        .eq('is_active', true);

      if (error) throw error;

      const logoData = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      setCurrentLogo(logoData?.site_logo_url || null);
      setCurrentDarkLogo(logoData?.site_logo_dark_url || null);
    } catch (error) {
      console.error('Error loading current logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (PNG, JPG, JPEG, WebP, or SVG)';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const uploadLogo = async (file: File, logoType: 'light' | 'dark'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${logoType}-logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('guide-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileUpload = async (files: FileList | null, logoType: 'light' | 'dark') => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);

    try {
      const logoUrl = await uploadLogo(file, logoType);
      
      // Update database
      const settingKey = logoType === 'light' ? 'site_logo_url' : 'site_logo_dark_url';
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({ 
          setting_value: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (updateError) throw updateError;

      // Update local state
      if (logoType === 'light') {
        setCurrentLogo(logoUrl);
      } else {
        setCurrentDarkLogo(logoUrl);
      }

      toast.success(`${logoType === 'light' ? 'Light' : 'Dark'} logo uploaded successfully!`);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload ${logoType} logo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async (logoType: 'light' | 'dark') => {
    try {
      const settingKey = logoType === 'light' ? 'site_logo_url' : 'site_logo_dark_url';
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          setting_value: null,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      if (logoType === 'light') {
        setCurrentLogo(null);
      } else {
        setCurrentDarkLogo(null);
      }

      toast.success(`${logoType === 'light' ? 'Light' : 'Dark'} logo removed successfully!`);
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(`Failed to remove ${logoType} logo: ${error.message}`);
    }
  };

  const previewLogo = (logoUrl: string) => {
    window.open(logoUrl, '_blank');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo Management
        </CardTitle>
        <CardDescription>
          Upload and manage your website logos for light and dark themes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Light Theme Logo */}
        <div className="space-y-4">
          <h3 className="font-semibold">Light Theme Logo</h3>
          
          {currentLogo ? (
            <div className="border border-border rounded-lg p-4 bg-background">
              <div className="flex items-center gap-4">
                <img 
                  src={currentLogo} 
                  alt="Current light logo" 
                  className="h-12 w-auto max-w-48 object-contain"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewLogo(currentLogo)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLogo('light')}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No light theme logo uploaded
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files, 'light')}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentLogo ? 'Replace Light Logo' : 'Upload Light Logo'}
            </Button>
          </div>
        </div>

        {/* Dark Theme Logo */}
        <div className="space-y-4">
          <h3 className="font-semibold">Dark Theme Logo</h3>
          
          {currentDarkLogo ? (
            <div className="border border-border rounded-lg p-4 bg-muted">
              <div className="flex items-center gap-4">
                <img 
                  src={currentDarkLogo} 
                  alt="Current dark logo" 
                  className="h-12 w-auto max-w-48 object-contain"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewLogo(currentDarkLogo)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLogo('dark')}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No dark theme logo uploaded
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputDarkRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files, 'dark')}
              className="hidden"
            />
            <Button
              onClick={() => fileInputDarkRef.current?.click()}
              disabled={uploading}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentDarkLogo ? 'Replace Dark Logo' : 'Upload Dark Logo'}
            </Button>
          </div>
        </div>

        {/* Usage Info */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Logo Requirements:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Maximum file size: 5MB</li>
            <li>• Supported formats: PNG, JPG, JPEG, WebP, SVG</li>
            <li>• Recommended dimensions: 200x60px (or similar aspect ratio)</li>
            <li>• Light logo: Should work well on light backgrounds</li>
            <li>• Dark logo: Should work well on dark backgrounds</li>
            <li>• Transparent backgrounds are recommended for PNG files</li>
          </ul>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading logo...
          </div>
        )}
      </CardContent>
    </Card>
  );
};