// Convert various Google Maps URL formats to embeddable URL
export function getMapEmbedUrl(mapsUrl: string | null | undefined): string | null {
  if (!mapsUrl) return null;

  // Already an embed URL
  if (mapsUrl.includes('/maps/embed')) return mapsUrl;

  // Extract place name or coordinates from various Google Maps URL formats
  try {
    const url = new URL(mapsUrl);

    // Format: https://www.google.com/maps/place/Hagia+Sophia/...
    const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      const place = decodeURIComponent(placeMatch[1]);
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(place)}!5e0!3m2!1sen!2sus!4v1`;
    }

    // Format: https://maps.google.com/?q=Hagia+Sophia
    const qParam = url.searchParams.get('q');
    if (qParam) {
      return `https://www.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed`;
    }

    // Format: https://www.google.com/maps/@41.0082,28.9784,17z
    const coordMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }

    // Fallback: use the query as-is
    return `https://www.google.com/maps?q=${encodeURIComponent(mapsUrl)}&output=embed`;
  } catch {
    // If URL parsing fails, try using as search query
    return `https://www.google.com/maps?q=${encodeURIComponent(mapsUrl)}&output=embed`;
  }
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
