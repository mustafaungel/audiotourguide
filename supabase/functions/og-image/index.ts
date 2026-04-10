import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    // Fetch guide details
    const { data: guide, error } = await supabase
      .from('audio_guides')
      .select('id, title, description, location, image_url, image_urls, duration, category')
      .eq('id', guideId)
      .single();

    if (error || !guide) {
      // Redirect to SPA even if guide not found
      return Response.redirect(`https://audiotourguide.app/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`, 302);
    }

    const imageUrl = guide.image_url || guide.image_urls?.[0] || 'https://audiotourguide.app/logo-audio-tour-guides.png';
    const description = (guide.description || `Listen to ${guide.title} audio tour guide.`).substring(0, 155);
    const title = `${guide.title} | Audio Tour Guides`;
    const pageUrl = `https://audiotourguide.app/access/${guide.id}${accessCode ? `?access_code=${accessCode}` : ''}`;
    const durationMin = guide.duration ? Math.floor(guide.duration / 60) : '';

    // Return HTML with OG meta tags + auto-redirect for real users
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph -->
  <meta property="og:title" content="${guide.title}${guide.location ? ` in ${guide.location}` : ''}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="1024">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Audio Tour Guides">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${guide.title}${guide.location ? ` in ${guide.location}` : ''}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
  <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">${guide.title}</a>...</p>
  ${durationMin ? `<p>${guide.location} - ${durationMin} min</p>` : ''}
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
    // Fallback: redirect to SPA
    return Response.redirect(`https://audiotourguide.app/access/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`, 302);
  }
});
