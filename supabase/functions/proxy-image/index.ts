import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/dist/module/lib/cors.js";

const ALLOWED_ORIGINS = [
  "https://dsaqlgxajdnwoqvtsrqd.supabase.co",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate origin — only proxy Supabase storage URLs
    const parsed = new URL(imageUrl);
    const isAllowed = ALLOWED_ORIGINS.some((o) => imageUrl.startsWith(o));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the image from Supabase storage
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: imageResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBody = await imageResponse.arrayBuffer();

    return new Response(imageBody, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("proxy-image error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
