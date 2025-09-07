import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Image, Pin, MapPin, Upload, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TextareaWithCounter, InputWithCounter } from '@/components/ui/character-counter';

interface ContentCreationProps {
  onContentCreated?: () => void;
  onClose?: () => void;
}

export const ContentCreation: React.FC<ContentCreationProps> = ({ onContentCreated, onClose }) => {
  const [updateType, setUpdateType] = useState<'post' | 'announcement' | 'guide_update'>('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
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

  const handleCreateContent = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create content.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content for your update.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      const { error } = await supabase
        .from('creator_updates')
        .insert({
          creator_id: user.id,
          update_type: updateType,
          title: title.trim() || null,
          content: content.trim(),
          image_url: imageUrl,
          is_pinned: isPinned,
        });

      if (error) throw error;

      toast({
        title: "Content created!",
        description: "Your update has been shared successfully.",
      });

      // Reset form
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      setUpdateType('post');
      setIsPinned(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onContentCreated?.();
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error creating content",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Pin className="w-4 h-4" />;
      case 'guide_update':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Update</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Update Type Selection */}
        <div>
          <Label>Update Type</Label>
          <Select value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Regular Post
                </div>
              </SelectItem>
              <SelectItem value="announcement">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Announcement
                </div>
              </SelectItem>
              <SelectItem value="guide_update">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Guide Update
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title (optional for regular posts) */}
        <div>
          <InputWithCounter
            maxLength={80}
            label={`Title ${updateType !== 'post' ? '*' : ''}`}
            placeholder={updateType === 'post' ? 'Optional title...' : 'Enter a title...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helpText="Keep it concise and engaging"
          />
        </div>

        {/* Content */}
        <div>
          <TextareaWithCounter
            maxLength={2000}
            label="Content *"
            placeholder="Share what's happening..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
            helpText="Share updates, announcements, or guide information"
            showProgress
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label>Add Image (Optional)</Label>
          <div className="mt-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose Image
            </Button>
          </div>

          {imagePreview && (
            <div className="mt-4">
              <div className="relative rounded-lg overflow-hidden bg-muted max-w-xs">
                <img src={imagePreview} alt="Preview" className="w-full h-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pin Option */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Pin this update</Label>
            <div className="text-sm text-muted-foreground">
              Pinned updates appear at the top of your feed
            </div>
          </div>
          <Switch
            checked={isPinned}
            onCheckedChange={setIsPinned}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleCreateContent}
            disabled={isCreating || !content.trim()}
            className="flex-1"
          >
            {isCreating ? 'Publishing...' : 'Publish Update'}
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