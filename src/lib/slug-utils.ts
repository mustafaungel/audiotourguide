/**
 * Utility functions for slug generation and validation
 */

/**
 * Generates a URL-friendly slug from title and location
 */
export function generateSlugPreview(title: string, location: string = ''): string {
  if (!title.trim()) return '';
  
  // Clean and slugify title
  let titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  if (!location.trim()) {
    return titleSlug || 'guide';
  }
  
  // Parse location to extract city and country
  const locationParts = location.split(',').map(part => part.trim());
  let citySlug = '';
  let countrySlug = '';
  
  if (locationParts.length >= 2) {
    // Extract city (first part) and country (last part)
    citySlug = locationParts[0]
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    countrySlug = locationParts[locationParts.length - 1]
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  } else if (locationParts.length === 1) {
    // Only one location part, use it as country
    countrySlug = locationParts[0]
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Build the final slug: title-city-country
  let slug = titleSlug;
  if (citySlug) {
    slug += '-' + citySlug;
  }
  if (countrySlug) {
    slug += '-' + countrySlug;
  }
  
  return slug || 'guide';
}

/**
 * Validates if a slug is properly formatted
 */
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: 'Slug is required' };
  }
  
  if (slug.length < 3) {
    return { isValid: false, error: 'Slug must be at least 3 characters long' };
  }
  
  if (slug.length > 100) {
    return { isValid: false, error: 'Slug must be less than 100 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'Slug cannot start or end with a hyphen' };
  }
  
  if (slug.includes('--')) {
    return { isValid: false, error: 'Slug cannot contain consecutive hyphens' };
  }
  
  return { isValid: true };
}

/**
 * Sanitizes a slug to ensure it meets requirements
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}