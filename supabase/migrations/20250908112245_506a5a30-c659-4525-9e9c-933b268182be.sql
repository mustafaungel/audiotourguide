-- Ensure guide-audio storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guide-audio', 'guide-audio', true)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  updated_at = now();

-- Create policies for guide-audio bucket if they don't exist
INSERT INTO storage.policies (
  id, 
  bucket_id, 
  name, 
  definition, 
  check_definition, 
  command, 
  roles
) VALUES (
  'guide-audio-public-access',
  'guide-audio',
  'Anyone can view audio files',
  'true',
  'true',
  'SELECT',
  '{authenticated,anon}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (
  id, 
  bucket_id, 
  name, 
  definition, 
  check_definition, 
  command, 
  roles
) VALUES (
  'guide-audio-creator-upload',
  'guide-audio',
  'Creators can upload audio files',
  'true',
  'true', 
  'INSERT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;