/**
 * Utility functions for country management and flag display
 */

// Country data with flags and names
export const countryFlags: Record<string, string> = {
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'India': '🇮🇳',
  'Egypt': '🇪🇬',
  'Mexico': '🇲🇽',
  'Peru': '🇵🇪',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦',
  'Morocco': '🇲🇦',
  'Kenya': '🇰🇪',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Cambodia': '🇰🇭',
  'Nepal': '🇳🇵',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'Russia': '🇷🇺',
  'Norway': '🇳🇴',
  'Sweden': '🇸🇪',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Iceland': '🇮🇸',
  'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Czech Republic': '🇨🇿',
  'Poland': '🇵🇱',
  'Croatia': '🇭🇷',
  'Slovenia': '🇸🇮',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬',
  'Serbia': '🇷🇸',
  'Montenegro': '🇲🇪',
  'Bosnia and Herzegovina': '🇧🇦',
  'Macedonia': '🇲🇰',
  'Albania': '🇦🇱',
  'Jordan': '🇯🇴',
  'Israel': '🇮🇱',
  'Lebanon': '🇱🇧',
  'Syria': '🇸🇾',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Saudi Arabia': '🇸🇦',
  'UAE': '🇦🇪',
  'Qatar': '🇶🇦',
  'Kuwait': '🇰🇼',
  'Oman': '🇴🇲',
  'Bahrain': '🇧🇭'
};

/**
 * Extracts country name from location string (e.g., "Cappadocia, Turkey" -> "Turkey")
 */
export function extractCountryFromLocation(location: string): string {
  if (!location) return '';
  
  // Split by comma and take the last part as country
  const parts = location.split(',').map(part => part.trim());
  return parts[parts.length - 1];
}

/**
 * Gets flag emoji for a country
 */
export function getCountryFlag(country: string): string {
  return countryFlags[country] || '🌍';
}

/**
 * Gets all unique countries from a list of guides
 */
export function getUniqueCountries(guides: any[]): Array<{country: string, flag: string, count: number}> {
  const countryMap = new Map<string, number>();
  
  guides.forEach(guide => {
    const country = extractCountryFromLocation(guide.location);
    if (country) {
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    }
  });
  
  return Array.from(countryMap.entries())
    .map(([country, count]) => ({
      country,
      flag: getCountryFlag(country),
      count
    }))
    .sort((a, b) => b.count - a.count); // Sort by guide count descending
}

/**
 * Filters guides by country
 */
export function filterGuidesByCountry(guides: any[], country: string): any[] {
  return guides.filter(guide => {
    const guideCountry = extractCountryFromLocation(guide.location);
    return guideCountry === country;
  });
}

/**
 * Creates a URL-friendly slug from country name
 */
export function createCountrySlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Converts country slug back to country name
 */
export function getCountryFromSlug(slug: string): string {
  // Simple reverse mapping - in a real app you might want a more robust solution
  const country = Object.keys(countryFlags).find(country => 
    createCountrySlug(country) === slug
  );
  return country || '';
}