import { Helmet } from 'react-helmet-async';

interface HreflangLink {
  lang: string;
  url: string;
}

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  type?: 'website' | 'article';
  structuredData?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
  locale?: string;
  author?: string;
  hreflangLinks?: HreflangLink[];
  geoPlaceName?: string;
  geoRegion?: string;
  geoPosition?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  image = 'https://guided-sound-ai.lovable.app/logo-audio-tour-guides.png',
  type = 'website',
  structuredData,
  noindex = false,
  locale = 'en_US',
  author,
  hreflangLinks,
  geoPlaceName,
  geoRegion,
}) => {
  const fullTitle = `${title} | Audio Tour Guides`;
  const siteUrl = 'https://guided-sound-ai.lovable.app';
  const fullCanonicalUrl = canonicalUrl || siteUrl;
  // Truncate description to 155 chars for SERP display
  const safeDescription = description.length > 155 ? description.substring(0, 152) + '...' : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={fullCanonicalUrl} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Geo Meta Tags (for local SEO) */}
      {geoPlaceName && <meta name="geo.placename" content={geoPlaceName} />}
      {geoRegion && <meta name="geo.region" content={geoRegion} />}

      {/* Hreflang Tags (multi-language SEO) */}
      {hreflangLinks && hreflangLinks.map((link) => (
        <link key={link.lang} rel="alternate" hrefLang={link.lang} href={link.url} />
      ))}
      {hreflangLinks && hreflangLinks.length > 0 && (
        <link rel="alternate" hrefLang="x-default" href={fullCanonicalUrl} />
      )}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Audio Tour Guides" />
      <meta property="og:locale" content={locale} />
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
    </Helmet>
  );
};
