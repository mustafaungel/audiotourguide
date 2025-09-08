/**
 * Utility functions for URL generation
 */

/**
 * Gets the base URL of the current application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Check if we're in production/live environment
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('audiotourguide.app')) {
      return 'https://audiotourguide.app';
    }
    return currentOrigin;
  }
  
  // This should only be used in browser environments
  // Edge functions should use the SITE_URL environment variable
  throw new Error('getBaseUrl() should only be called in browser environments');
}

/**
 * Generates a guide detail URL
 */
export function getGuideUrl(guideId: string): string {
  return `${getBaseUrl()}/guide/${guideId}`;
}

/**
 * Generates a preview URL for guides
 */
export function getGuidePreviewUrl(guideId: string): string {
  return getGuideUrl(guideId);
}

/**
 * Opens a guide in a new tab
 */
export function openGuidePreview(guideId: string): void {
  const url = getGuidePreviewUrl(guideId);
  window.open(url, '_blank');
}