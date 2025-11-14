-- Update guide-audio bucket to support all common audio MIME types
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/mp3', 
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-flac'
  ]
WHERE id = 'guide-audio';