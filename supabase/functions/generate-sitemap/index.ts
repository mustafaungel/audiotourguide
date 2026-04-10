import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Base URL for the site
    const baseUrl = 'https://audiotourguide.app';

    // Fetch all published and approved guides
    const { data: guides, error: guidesError } = await supabase
      .from('audio_guides')
      .select('slug, updated_at, image_url, title, location')
      .eq('is_published', true)
      .eq('is_approved', true)
      .order('updated_at', { ascending: false });

    if (guidesError) {
      console.error('Error fetching guides:', guidesError);
      throw guidesError;
    }

    // Get unique countries from locations
    const locations = await supabase
      .from('audio_guides')
      .select('location')
      .eq('is_published', true)
      .eq('is_approved', true);

    const countries = new Set<string>();
    if (locations.data) {
      locations.data.forEach(item => {
        if (item.location) {
          // Extract country (last part after comma)
          const parts = item.location.split(',');
          const country = parts[parts.length - 1]?.trim();
          if (country) {
            countries.add(country);
          }
        }
      });
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/guides</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/country</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/featured-guides</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Country Pages -->
${Array.from(countries).map(country => {
  const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `  <url>
    <loc>${baseUrl}/country/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
  
  <!-- Guide Detail Pages -->
${guides?.map(guide => {
  const lastmod = guide.updated_at ? new Date(guide.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const imageSection = guide.image_url ? `
    <image:image>
      <image:loc>${guide.image_url}</image:loc>
      <image:title>${guide.title?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}</image:title>
    </image:image>` : '';
  
  return `  <url>
    <loc>${baseUrl}/guide/${guide.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageSection}
  </url>`;
}).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
