/**
 * Utility functions for URL generation
 */

const SUPABASE_STORAGE_BASE = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/';
const SUPABASE_FUNCTIONS_BASE = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1';

/**
 * Gets the base URL of the current application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return 'https://audiotourguide.app';
  }
  throw new Error('getBaseUrl() should only be called in browser environments');
}

/**
 * Gets the current origin (preview or production) for testing purposes
 */
export function getCurrentOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : getBaseUrl();
}

/**
 * Builds an access URL for a guide
 * @param mode 'preview' uses current origin, 'public' uses production domain
 */
export function buildAccessUrl(
  guideId: string,
  accessCode: string,
  mode: 'preview' | 'public' = 'preview'
): string {
  const base = mode === 'preview' ? getCurrentOrigin() : getBaseUrl();
  return `${base}/access/${guideId}?access_code=${accessCode}`;
}

/**
 * Generates a guide detail URL using slug
 */
export function getGuideUrl(slug: string): string {
  return `${getBaseUrl()}/guide/${slug}`;
}

/**
 * Generates a guide detail URL using guide ID (legacy support)
 */
export function getGuideUrlById(guideId: string): string {
  return `${getBaseUrl()}/guide/${guideId}`;
}

/**
 * Generates a preview URL for guides using slug
 */
export function getGuidePreviewUrl(slug: string): string {
  return getGuideUrl(slug);
}

/**
 * Opens a guide in a new tab using slug
 */
export function openGuidePreview(slug: string): void {
  const url = getGuidePreviewUrl(slug);
  window.open(url, '_blank');
}

/**
 * Checks if a URL is a Supabase storage URL
 */
function isSupabaseStorageUrl(url: string): boolean {
  return url.startsWith(SUPABASE_STORAGE_BASE);
}

/**
 * Returns a proxied image URL that serves the image through the main domain's
 * Edge Function, so Google treats it as same-domain for sitemap indexing.
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder.svg';
  if (!isSupabaseStorageUrl(imageUrl)) return imageUrl;
  return `${SUPABASE_FUNCTIONS_BASE}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Returns the direct image URL without any transformations.
 * Use this for rendering in <img> tags (fast, no proxy overhead).
 */
export function getDirectImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder.svg';
  return imageUrl;
}

/**
 * @deprecated Use getDirectImageUrl() for rendering, getProxiedImageUrl() for SEO.
 * This function now returns the direct URL to avoid broken Supabase Image Transformation 404s.
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  _options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string {
  return getDirectImageUrl(imageUrl);
}
