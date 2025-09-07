import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AudioFile {
  guideId: string;
  fileName: string;
  title: string;
}

const audioFiles: AudioFile[] = [
  { guideId: '27126c34-a437-4d2d-82f3-c58b471e3f00', fileName: 'guide1.mp3', title: 'Hidden Gems of Montmartre' },
  { guideId: '508b4113-4a37-4827-a139-ccf801130b8b', fileName: 'guide2.mp3', title: 'Ancient Rome: Colosseum Secrets' },
  { guideId: 'd5a24440-bf75-49bc-b385-df3b6b90e482', fileName: 'guide3.mp3', title: 'Zen Gardens of Kyoto' },
  { guideId: 'd8daa3f2-8b65-417c-afc8-664f0e317e72', fileName: 'guide4.mp3', title: 'Santorini Sunset Magic' },
];

export const AudioUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const uploadAudioFiles = async () => {
    setUploading(true);
    
    try {
      for (const audioFile of audioFiles) {
        // Fetch the audio file from the tmp directory
        const response = await fetch(`/tmp/${audioFile.fileName}`);
        if (!response.ok) {
          console.warn(`Could not fetch ${audioFile.fileName}, skipping...`);
          continue;
        }
        
        const blob = await response.blob();
        const file = new File([blob], `${audioFile.guideId}.mp3`, { type: 'audio/mpeg' });
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guide-audio')
          .upload(`${audioFile.guideId}.mp3`, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${audioFile.title}:`, uploadError);
          toast.error(`Failed to upload ${audioFile.title}`);
          continue;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${audioFile.guideId}.mp3`);

        // Update the database with the audio URL
        const { error: updateError } = await supabase
          .from('audio_guides')
          .update({ 
            audio_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', audioFile.guideId);

        if (updateError) {
          console.error(`Error updating database for ${audioFile.title}:`, updateError);
          toast.error(`Failed to update database for ${audioFile.title}`);
          continue;
        }

        setUploadedFiles(prev => [...prev, audioFile.title]);
        toast.success(`Uploaded audio for ${audioFile.title}`);
      }
      
      toast.success('All audio files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading audio files:', error);
      toast.error('Failed to upload audio files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Audio File Uploader</h2>
        <p className="text-muted-foreground mb-4">
          Upload sample audio files for testing the audio player functionality.
        </p>
        
        <Button 
          onClick={uploadAudioFiles}
          disabled={uploading}
          className="mb-4"
        >
          {uploading ? 'Uploading...' : 'Upload Sample Audio Files'}
        </Button>
        
        {uploadedFiles.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Uploaded Files:</h3>
            <ul className="list-disc list-inside space-y-1">
              {uploadedFiles.map((title, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};