import React, { useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  label: string;
  documentType: 'id' | 'license';
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  required?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  documentType,
  onUploadComplete,
  currentUrl,
  required = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
      onUploadComplete(publicUrl);

      toast({
        title: "Upload successful",
        description: `${label} has been uploaded.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${documentType}-upload`}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      {preview ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-muted-foreground">
                  {currentUrl ? 'Current document' : 'Ready for submission'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeDocument}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {preview.startsWith('blob:') && (
            <div className="mt-3">
              <img 
                src={preview} 
                alt={`${label} preview`}
                className="max-w-full h-32 object-cover rounded border"
              />
            </div>
          )}
        </Card>
      ) : (
        <div className="relative">
          <Input
            id={`${documentType}-upload`}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Label
            htmlFor={`${documentType}-upload`}
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : `Click to upload ${label.toLowerCase()}`}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP, or PDF (max 5MB)
            </span>
          </Label>
        </div>
      )}
    </div>
  );
};