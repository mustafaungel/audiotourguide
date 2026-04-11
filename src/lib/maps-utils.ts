// Convert various Google Maps URL formats to embeddable URL
export function getMapEmbedUrl(mapsUrl: string | null | undefined): string | null {
  if (!mapsUrl) return null;

  // Already an embed URL
  if (mapsUrl.includes('/maps/embed')) return mapsUrl;
  if (mapsUrl.includes('output=embed')) return mapsUrl;

  // Extract place name from /maps/place/PLACE_NAME/... format
  const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
  }

  // Extract coordinates from @lat,lng format
  const coordMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
  }

  // Extract ?q= parameter
  try {
    const url = new URL(mapsUrl);
    const qParam = url.searchParams.get('q');
    if (qParam) {
      return `https://www.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed`;
    }
  } catch {}

  // Short links (maps.app.goo.gl, goo.gl/maps) — can't resolve client-side
  // Use the guide's location name instead
  return null;
}

// Parse coordinates from Google Maps URL
export function parseCoordinates(mapsUrl: string | null | undefined): { lat: number; lng: number } | null {
  if (!mapsUrl) return null;

  // Format: @41.0082,28.9784 or @41.0082,28.9784,17z
  const match = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  // Format: !3d41.0082!4d28.9784 (embed URL format)
  const embedMatch = mapsUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (embedMatch) {
    return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };
  }

  return null;
}
