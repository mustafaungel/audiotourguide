/**
 * Utility functions for URL generation
 */

/**
 * Gets the base URL of the current application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Always use production URL for external sharing and links
    return 'https://audiotourguide.app';
  }
  
  // This should only be used in browser environments
  // Edge functions should use the SITE_URL environment variable
  throw new Error('getBaseUrl() should only be called in browser environments');
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