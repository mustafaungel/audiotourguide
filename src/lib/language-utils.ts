// Language flag and name mapping utility
const LANGUAGE_FLAGS: Record<string, string> = {
  'en': '🇺🇸', // English (US)
  'es': '🇪🇸', // Spanish
  'fr': '🇫🇷', // French
  'de': '🇩🇪', // German
  'it': '🇮🇹', // Italian
  'pt': '🇵🇹', // Portuguese
  'ru': '🇷🇺', // Russian
  'zh': '🇨🇳', // Chinese
  'ja': '🇯🇵', // Japanese
  'ko': '🇰🇷', // Korean
  'ar': '🇸🇦', // Arabic
  'tr': '🇹🇷', // Turkish
  'nl': '🇳🇱', // Dutch
  'sv': '🇸🇪', // Swedish
  'no': '🇳🇴', // Norwegian
  'da': '🇩🇰', // Danish
  'fi': '🇫🇮', // Finnish
  'pl': '🇵🇱', // Polish
  'cs': '🇨🇿', // Czech
  'hu': '🇭🇺', // Hungarian
  'ro': '🇷🇴', // Romanian
  'bg': '🇧🇬', // Bulgarian
  'hr': '🇭🇷', // Croatian
  'sr': '🇷🇸', // Serbian
  'sk': '🇸🇰', // Slovak
  'sl': '🇸🇮', // Slovenian
  'lv': '🇱🇻', // Latvian
  'lt': '🇱🇹', // Lithuanian
  'et': '🇪🇪', // Estonian
  'el': '🇬🇷', // Greek
  'he': '🇮🇱', // Hebrew
  'hi': '🇮🇳', // Hindi
  'th': '🇹🇭', // Thai
  'vi': '🇻🇳', // Vietnamese
  'id': '🇮🇩', // Indonesian
  'ms': '🇲🇾', // Malay
  'tl': '🇵🇭', // Filipino
  'uk': '🇺🇦', // Ukrainian
  'be': '🇧🇾', // Belarusian
  'ka': '🇬🇪', // Georgian
  'hy': '🇦🇲', // Armenian
  'az': '🇦🇿', // Azerbaijani
  'kk': '🇰🇿', // Kazakh
  'ky': '🇰🇬', // Kyrgyz
  'uz': '🇺🇿', // Uzbek
  'tg': '🇹🇯', // Tajik
  'mn': '🇲🇳', // Mongolian
};

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'zh': '中文',
  'ja': '日本語',
  'ko': '한국어',
  'ar': 'العربية',
  'tr': 'Türkçe',
  'nl': 'Nederlands',
  'sv': 'Svenska',
  'no': 'Norsk',
  'da': 'Dansk',
  'fi': 'Suomi',
  'pl': 'Polski',
  'cs': 'Čeština',
  'hu': 'Magyar',
  'ro': 'Română',
  'bg': 'Български',
  'hr': 'Hrvatski',
  'sr': 'Српски',
  'sk': 'Slovenčina',
  'sl': 'Slovenščina',
  'lv': 'Latviešu',
  'lt': 'Lietuvių',
  'et': 'Eesti',
  'el': 'Ελληνικά',
  'he': 'עברית',
  'hi': 'हिन्दी',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'id': 'Bahasa Indonesia',
  'ms': 'Bahasa Melayu',
  'tl': 'Filipino',
  'uk': 'Українська',
  'be': 'Беларуская',
  'ka': 'ქართული',
  'hy': 'Հայերեն',
  'az': 'Azərbaycan',
  'kk': 'Қазақша',
  'ky': 'Кыргызча',
  'uz': 'O\'zbek',
  'tg': 'Тоҷикӣ',
  'mn': 'Монгол',
};

/**
 * Get the flag emoji for a language code
 */
export function getLanguageFlag(languageCode: string): string {
  return LANGUAGE_FLAGS[languageCode.toLowerCase()] || '🌐';
}

/**
 * Get the native name for a language code
 */
export function getLanguageName(languageCode: string): string {
  return LANGUAGE_NAMES[languageCode.toLowerCase()] || languageCode.toUpperCase();
}

/**
 * Get both flag and name formatted for display
 */
export function getLanguageDisplay(languageCode: string, fallbackName?: string): string {
  const flag = getLanguageFlag(languageCode);
  const name = fallbackName || getLanguageName(languageCode);
  return `${flag} ${name}`;
}