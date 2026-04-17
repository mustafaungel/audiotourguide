// Strip Google Maps tracking params for cleaner, more reliable URLs
export function normalizeMapsUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    ['entry', 'g_ep', 'shorturl', 'ved', 'g_st'].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return trimmed;
  }
}

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
  return null;
}

// Parse coordinates from Google Maps URL
export function parseCoordinates(mapsUrl: string | null | undefined): { lat: number; lng: number } | null {
  if (!mapsUrl) return null;

  const match = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  const embedMatch = mapsUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (embedMatch) {
    return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };
  }

  return null;
}

/**
 * Smart open: tries native maps app on iOS/Android, falls back to web Google Maps.
 * On desktop opens in a new tab.
 */
export function openMapsLink(url: string | null | undefined): void {
  if (!url) return;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  // Always-safe fallback
  const openWeb = () => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  };

  if (isIOS) {
    // Try Apple Maps via maps:// — falls back to web after a short delay if app not installed
    const coords = parseCoordinates(url);
    let nativeUrl: string | null = null;

    if (coords) {
      nativeUrl = `maps://?q=${coords.lat},${coords.lng}`;
    } else {
      // For short links / place links, just open in browser — Google Maps app intent will catch it
      openWeb();
      return;
    }

    const timeout = setTimeout(() => openWeb(), 700);
    const visibilityHandler = () => {
      if (document.hidden) clearTimeout(timeout);
    };
    document.addEventListener('visibilitychange', visibilityHandler, { once: true });
    window.location.href = nativeUrl;
    return;
  }

  if (isAndroid) {
    // Google Maps app catches https links via intent automatically
    openWeb();
    return;
  }

  // Desktop
  openWeb();
}

// Title slug for the special Cappadocia guide where per-section maps are enabled.
// Used to gate the admin UI so other guides stay clean.
export const SECTION_MAPS_ENABLED_SLUGS = new Set<string>([
  'cappadocia-discover-hidden-valleys',
]);

export function isSectionMapsEnabled(slug?: string | null, title?: string | null): boolean {
  if (slug && SECTION_MAPS_ENABLED_SLUGS.has(slug)) return true;
  if (title && /cappadocia/i.test(title) && /hidden\s*valleys/i.test(title)) return true;
  return false;
}
