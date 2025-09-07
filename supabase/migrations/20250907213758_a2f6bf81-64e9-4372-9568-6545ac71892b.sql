-- Clear all existing QR codes and share URLs since they have wrong domain
UPDATE audio_guides 
SET 
  qr_code_url = NULL,
  share_url = NULL,
  updated_at = now()
WHERE qr_code_url IS NOT NULL OR share_url IS NOT NULL;