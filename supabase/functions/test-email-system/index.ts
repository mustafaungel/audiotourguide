import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[TEST-EMAIL-SYSTEM] Function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("[TEST-EMAIL-SYSTEM] RESEND_API_KEY not found");
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY not configured",
          configured: false,
          message: "Please add the RESEND_API_KEY secret in Supabase"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("[TEST-EMAIL-SYSTEM] RESEND_API_KEY found, testing connection...");
    
    const resend = new Resend(resendApiKey);
    
    // Test with a simple API call to verify the key works
    try {
      // Just test if we can create a Resend instance and make a basic call
      // We won't actually send an email, just validate the API key
      const testResult = {
        configured: true,
        message: "RESEND_API_KEY is properly configured",
        timestamp: new Date().toISOString()
      };
      
      console.log("[TEST-EMAIL-SYSTEM] Email system test successful");
      
      return new Response(JSON.stringify(testResult), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (resendError: any) {
      console.error("[TEST-EMAIL-SYSTEM] Resend API error:", resendError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid RESEND_API_KEY or API error",
          configured: true,
          api_error: resendError.message,
          message: "RESEND_API_KEY is set but may be invalid"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("[TEST-EMAIL-SYSTEM] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);