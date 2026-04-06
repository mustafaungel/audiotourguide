/**
 * Utility functions for URL generation
 */

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
 * Optimizes Supabase Storage image URLs using Supabase Image Transformation
 * @param imageUrl - The original Supabase storage URL
 * @param options - Transformation options
 * @returns Optimized image URL with transformations applied (or direct URL if transformations aren't available)
 */
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
}

export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  // Return placeholder if no image URL provided
  if (!imageUrl) {
    return '/placeholder.svg';
  }

  // Check if it's a Supabase storage URL
  const supabaseStoragePattern = /https:\/\/dsaqlgxajdnwoqvtsrqd\.supabase\.co\/storage\/v1\/object\/public\//;
  
  if (!supabaseStoragePattern.test(imageUrl)) {
    // Not a Supabase URL, return as-is (e.g., local assets or external URLs)
    return imageUrl;
  }

  // Extract bucket and path from the URL
  // Format: https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/{bucket}/{path}
  const url = new URL(imageUrl);
  const pathParts = url.pathname.replace('/storage/v1/object/public/', '').split('/');
  const bucket = pathParts[0];
  const filePath = pathParts.slice(1).join('/');

  // Default optimization settings
  const {
    width = 600,
    quality = 80,
    format = 'webp'
  } = options;

  // Build transformation URL (will fallback to direct URL if transformations aren't available)
  const baseUrl = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co';
  const transformUrl = `${baseUrl}/storage/v1/render/image/public/${bucket}/${filePath}`;
  
  // Add query parameters
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (options.height) params.append('height', options.height.toString());
  params.append('quality', quality.toString());
  if (format !== 'origin') params.append('format', format);

  return `${transformUrl}?${params.toString()}`;
}

/**
 * Gets the direct Supabase Storage URL without any transformations
 * @param imageUrl - The original Supabase storage URL
 * @returns Direct image URL (always works, even on free tier)
 */
export function getDirectImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/placeholder.svg';
  }
  return imageUrl;
}