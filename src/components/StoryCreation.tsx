import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Video, Type, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StoryCreationProps {
  onStoryCreated?: () => void;
  onClose?: () => void;
}

export const StoryCreation: React.FC<StoryCreationProps> = ({ onStoryCreated, onClose }) => {
  const [contentType, setContentType] = useState<'image' | 'video' | 'text'>('text');
  const [contentText, setContentText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [duration, setDuration] = useState(24);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('guide-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateStory = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create stories.",
        variant: "destructive",
      });
      return;
    }

    if (contentType === 'text' && !contentText.trim()) {
      toast({
        title: "Content required",
        description: "Please add some text for your story.",
        variant: "destructive",
      });
      return;
    }

    if ((contentType === 'image' || contentType === 'video') && !file) {
      toast({
        title: "File required",
        description: "Please select a file for your story.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      let contentUrl = null;

      if (file) {
        contentUrl = await uploadFile(file);
      }

      const { error } = await supabase
        .from('creator_stories')
        .insert({
          creator_id: user.id,
          content_type: contentType,
          content_url: contentUrl,
          content_text: contentType === 'text' ? contentText : null,
          duration_seconds: duration,
          background_color: backgroundColor,
        });

      if (error) throw error;

      toast({
        title: "Story created!",
        description: "Your story has been published successfully.",
      });

      // Reset form
      setContentText('');
      setFile(null);
      setPreview(null);
      setContentType('text');
      setBackgroundColor('#000000');
      setDuration(24);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onStoryCreated?.();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error creating story",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const backgroundColors = [
    '#000000', '#1a1a1a', '#333333', '#4a5568', '#2d3748',
    '#1a365d', '#153e75', '#2a69ac', '#3182ce', '#4299e1',
    '#553c9a', '#6b46c1', '#805ad5', '#9f7aea', '#b794f6',
    '#702459', '#97266d', '#b83280', '#d53f8c', '#ed64a6',
    '#742a2a', '#9c4221', '#c05621', '#dd6b20', '#ed8936',
    '#276749', '#2f855a', '#38a169', '#48bb78', '#68d391'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Story</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Type Selection */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={contentType === 'text' ? 'default' : 'outline'}
            onClick={() => setContentType('text')}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Text
          </Button>
          <Button
            variant={contentType === 'image' ? 'default' : 'outline'}
            onClick={() => setContentType('image')}
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Image
          </Button>
          <Button
            variant={contentType === 'video' ? 'default' : 'outline'}
            onClick={() => setContentType('video')}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Video
          </Button>
        </div>

        {/* Text Content */}
        {contentType === 'text' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-text">Story Text</Label>
              <Textarea
                id="content-text"
                placeholder="Share what's on your mind..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div>
              <Label>Background Color</Label>
              <div className="grid grid-cols-10 gap-2 mt-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      backgroundColor === color ? 'border-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        {(contentType === 'image' || contentType === 'video') && (
          <div className="space-y-4">
            <div>
              <Label>
                {contentType === 'image' ? 'Upload Image' : 'Upload Video'}
              </Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose {contentType === 'image' ? 'Image' : 'Video'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4">
                <Label>Preview</Label>
                <div className="mt-2 relative rounded-lg overflow-hidden bg-muted max-w-xs">
                  {contentType === 'image' ? (
                    <img src={preview} alt="Preview" className="w-full h-auto" />
                  ) : (
                    <video src={preview} className="w-full h-auto" controls />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Duration Setting */}
        <div>
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="15">15 seconds</SelectItem>
              <SelectItem value="24">24 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleCreateStory}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? 'Creating...' : 'Publish Story'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};