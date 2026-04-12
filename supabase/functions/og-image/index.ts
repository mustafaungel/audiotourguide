import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_STORAGE_BASE = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/';
const CDN_BASE = 'https://audiotourguide.app/cdn';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toCdnUrl(url: string): string {
  if (url.startsWith(SUPABASE_STORAGE_BASE)) {
    return `${CDN_BASE}/${url.replace(SUPABASE_STORAGE_BASE, '')}`;
  }
  return url;
}

serve(async (req) => {
  const url = new URL(req.url);
  const guideId = url.searchParams.get('id');
  const accessCode = url.searchParams.get('access_code');

  if (!guideId) {
    return new Response('Missing guide ID', { status: 400 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: guide, error } = await supabase
      .from('audio_guides')
      .select('id, title, description, location, image_url, image_urls, duration, category')
      .eq('id', guideId)
      .single();

    if (error || !guide) {
      return Response.redirect(`https://audiotourguide.app/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`, 302);
    }

    const rawImageUrl = guide.image_url || guide.image_urls?.[0] || 'https://audiotourguide.app/logo-audio-tour-guides.png';
    const imageUrl = toCdnUrl(rawImageUrl);
    const rawDescription = (guide.description || `Listen to ${guide.title} audio tour guide.`).substring(0, 155);
    const description = escapeHtml(rawDescription);
    const safeTitle = escapeHtml(guide.title);
    const safeLocation = guide.location ? escapeHtml(guide.location) : '';
    const titleTag = `${safeTitle} | Audio Tour Guides`;
    const pageUrl = `https://audiotourguide.app/access/${guide.id}${accessCode ? `?access_code=${accessCode}` : ''}`;
    const canonicalUrl = `https://audiotourguide.app/access/${guide.id}`;
    const durationMin = guide.duration ? Math.floor(guide.duration / 60) : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleTag}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:title" content="${safeTitle}${safeLocation ? ` in ${safeLocation}` : ''}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="1024">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Audio Tour Guides">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}${safeLocation ? ` in ${safeLocation}` : ''}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
  <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">${safeTitle}</a>...</p>
  ${durationMin ? `<p>${safeLocation} - ${durationMin} min</p>` : ''}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return Response.redirect(`https://audiotourguide.app/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`, 302);
  }
});