import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Download, Eye, Trash2, Wand2 } from 'lucide-react';
import { AudioGuideLoader } from './AudioGuideLoader';
import { supabase } from '@/integrations/supabase/client';
import { useSiteBranding } from '@/hooks/useSiteBranding';
import { toast } from 'sonner';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

interface EnhancedLogoUploaderProps {
  className?: string;
}

export function EnhancedLogoUploader({ className }: EnhancedLogoUploaderProps) {
  const { branding, loading: brandingLoading, updateBranding } = useSiteBranding();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const lightFileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PNG, JPG, WebP, or SVG file.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const processImageForTransparency = async (file: File) => {
    try {
      setIsProcessing(true);
      toast.info('Processing image to remove background...');
      
      // Load the image
      const imageElement = await loadImage(file);
      setOriginalImage(URL.createObjectURL(file));
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      
      // Create preview URL
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImage(processedUrl);
      
      toast.success('Background removed successfully! You can now upload the processed logo.');
      return processedBlob;
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. You can still upload the original.');
      return file;
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadLogo = async (file: File | Blob, logoType: 'light' | 'dark'): Promise<string> => {
    const fileName = `logo-${logoType}-${Date.now()}.png`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
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

    try {
      setIsUploading(true);
      
      // Process image for transparency
      const processedFile = await processImageForTransparency(file);
      
      // Upload the processed image
      const logoUrl = await uploadLogo(processedFile, logoType);
      
      // Update branding in database
      const settingKey = logoType === 'light' ? 'logoUrl' : 'darkLogoUrl';
      await updateBranding(settingKey, logoUrl);
      
      toast.success(`${logoType === 'light' ? 'Light' : 'Dark'} theme logo uploaded successfully!`);
      
      // Clear processed images
      setProcessedImage(null);
      setOriginalImage(null);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload logo: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async (logoType: 'light' | 'dark') => {
    try {
      const settingKey = logoType === 'light' ? 'logoUrl' : 'darkLogoUrl';
      await updateBranding(settingKey, '');
      toast.success(`${logoType === 'light' ? 'Light' : 'Dark'} theme logo removed successfully!`);
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(`Failed to remove logo: ${error.message}`);
    }
  };

  const previewLogo = (logoUrl: string) => {
    window.open(logoUrl, '_blank');
  };

  const downloadProcessedImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'processed-logo.png';
    link.click();
  };

  if (brandingLoading) {
    return <Card className={className}><CardContent className="py-4"><AudioGuideLoader variant="inline" message="Loading logo settings..." /></CardContent></Card>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Enhanced Logo Management
        </CardTitle>
        <CardDescription>
          Upload and automatically process your logo with transparent background for perfect light/dark theme compatibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Processing Preview */}
        {(originalImage || processedImage) && (
          <div className="space-y-4">
            <h4 className="font-medium">Image Processing Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {originalImage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Original</p>
                  <div className="relative border rounded-lg p-4 bg-checkered">
                    <img 
                      src={originalImage} 
                      alt="Original logo" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}
              {processedImage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processed (Transparent)</p>
                  <div className="relative border rounded-lg p-4 bg-checkered">
                    <img 
                      src={processedImage} 
                      alt="Processed logo" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  <Button
                    onClick={downloadProcessedImage}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Processed Logo
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Light Theme Logo */}
        <div className="space-y-4">
          <h4 className="font-medium">Light Theme Logo</h4>
          {branding?.logoUrl ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <img 
                src={branding.logoUrl} 
                alt="Light theme logo" 
                className="h-12 w-auto object-contain"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Current light theme logo</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => previewLogo(branding.logoUrl!)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => removeLogo('light')}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No light theme logo uploaded</p>
            </div>
          )}
          
          <input
            ref={lightFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, 'light')}
          />
          <Button
            onClick={() => lightFileInputRef.current?.click()}
            disabled={isUploading || isProcessing}
            className="w-full"
          >
            {isUploading || isProcessing ? (
              <ButtonLoader text={isProcessing ? 'Processing...' : 'Uploading...'} />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Light Theme Logo
              </>
            )}
          </Button>
        </div>

        {/* Dark Theme Logo */}
        <div className="space-y-4">
          <h4 className="font-medium">Dark Theme Logo</h4>
          {branding?.darkLogoUrl ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-900">
              <img 
                src={branding.darkLogoUrl} 
                alt="Dark theme logo" 
                className="h-12 w-auto object-contain"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-300">Current dark theme logo</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => previewLogo(branding.darkLogoUrl!)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => removeLogo('dark')}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-gray-900">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">No dark theme logo uploaded</p>
            </div>
          )}
          
          <input
            ref={darkFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, 'dark')}
          />
          <Button
            onClick={() => darkFileInputRef.current?.click()}
            disabled={isUploading || isProcessing}
            className="w-full"
          >
            {isUploading || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isProcessing ? 'Processing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Dark Theme Logo
              </>
            )}
          </Button>
        </div>

        {/* Logo Requirements */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <h5 className="font-medium text-foreground">Logo Requirements:</h5>
          <ul className="list-disc list-inside space-y-1">
            <li>Supported formats: PNG, JPG, WebP, SVG</li>
            <li>Maximum file size: 5MB</li>
            <li>Recommended: PNG format for best transparency support</li>
            <li>AI processing will automatically remove backgrounds</li>
            <li>Upload the same logo for both themes if it works on all backgrounds</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}