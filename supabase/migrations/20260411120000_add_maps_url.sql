-- Add maps_url column to audio_guides for Google Maps integration
ALTER TABLE audio_guides ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN audio_guides.maps_url IS 'Google Maps URL for the guide location. Used for map embed on detail page and SEO GeoCoordinates.';
