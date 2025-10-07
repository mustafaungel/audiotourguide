import { useState, useRef } from 'react';
import { Upload, X, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAudioDuration, formatDuration } from '@/utils/audioUtils';

interface AudioSectionUploaderProps {
  sectionIndex: number;
  currentAudioUrl?: string;
  currentDuration?: number;
  onUpload: (audioUrl: string, duration: number) => void;
  onRemove: () => void;
}

export function AudioSectionUploader({
  sectionIndex,
  currentAudioUrl,
  currentDuration,
  onUpload,
  onRemove,
}: AudioSectionUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    // Warn for large files
    if (file.size > 100 * 1024 * 1024) {
      toast.info('Large file detected. Upload may take several minutes.');
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Calculate duration first
      const duration = await getAudioDuration(file);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `wizard-section-${sectionIndex}-${timestamp}.${fileExt}`;

      // Upload to Supabase Storage with progress simulation
      const uploadPromise = supabase.storage
        .from('guide-audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await uploadPromise;
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('guide-audio')
        .getPublicUrl(data.path);

      toast.success('Audio uploaded successfully');
      onUpload(publicUrl, duration);
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      toast.error(error.message || 'Failed to upload audio');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const togglePlay = () => {
    if (!currentAudioUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!currentAudioUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Uploading audio... {uploadProgress}%
              </p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop audio file here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP3, WAV, M4A, or other audio formats
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Audio uploaded</p>
                {currentDuration && (
                  <p className="text-xs text-muted-foreground">
                    Duration: {formatDuration(currentDuration)}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <audio
            ref={audioRef}
            src={currentAudioUrl}
            onEnded={handleAudioEnded}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
