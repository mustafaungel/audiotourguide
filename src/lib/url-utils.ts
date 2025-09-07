/**
 * Utility functions for URL generation
 */

/**
 * Gets the base URL of the current application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side or edge functions
  return 'https://dsaqlgxajdnwoqvtsrqd.supabase.co';
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