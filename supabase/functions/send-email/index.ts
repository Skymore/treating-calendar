// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-nocheck - Ignore all TS errors in this file
// This is a Deno file, but the project is configured for Node environment

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from "npm:resend@4.1.2"

// Initialize Resend with your API key
// In production, use environment variables for the API key
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const resend = new Resend(RESEND_API_KEY)

// Email sending function
Deno.serve(async (req) => {
  try {
    // CORS headers to allow requests from your frontend
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    // Add CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // Add logs for debugging API key status
    console.log("API Key status:", RESEND_API_KEY ? "configured" : "not set or empty");
    
    // Get email data from request
    const { to, subject, html, text, from = "Thursday Treating <noreply@email.ruit.me>" } = await req.json();
    
    // Add request data logs
    console.log("Request data:", { to, subject, fromField: from, hasHtml: !!html, hasText: !!text });
    
    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.log("Missing required fields:", { to, subject, hasHtml: !!html, hasText: !!text });
      return new Response(
        JSON.stringify({ error: "Missing required fields (to, subject, and either html or text)" }),
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Send email using Resend
    console.log("Attempting to send email...");
    const sendResult = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log("Send result:", sendResult);
    
    const { data, error } = sendResult;

    if (error) {
      console.error("Email sending failed - Detailed error:", JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data?.id,
        details: data
      }),
      { 
        headers: corsHeaders
      }
    )
  } catch (error) {
    console.error("Unexpected error:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    )
  }
})

/* To invoke locally:

  1. First set your RESEND_API_KEY as an environment variable:
     - For local development: supabase secrets set RESEND_API_KEY=your_resend_api_key
     - For production: Use Supabase dashboard to set secrets

  2. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"to":"recipient@example.com","subject":"Test Email","html":"<p>This is a test email</p>"}'

*/
