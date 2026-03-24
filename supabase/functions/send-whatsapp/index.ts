import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTAURANT_PHONE = "+2347089989283";
const TWILIO_FROM = "whatsapp:+14155238886";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!TWILIO_API_KEY) {
    return new Response(JSON.stringify({ error: "TWILIO_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { to, message, notifyRestaurant } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { target: string; success: boolean; error?: string }[] = [];

    // Helper to send a single WhatsApp message
    const sendMessage = async (toNumber: string) => {
      const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${toNumber}`,
          From: TWILIO_FROM,
          Body: message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Twilio error [${response.status}]: ${JSON.stringify(data)}`);
      }
      return data;
    };

    // Send to customer if phone provided
    if (to) {
      try {
        await sendMessage(to);
        results.push({ target: "customer", success: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("Customer WhatsApp failed:", msg);
        results.push({ target: "customer", success: false, error: msg });
      }
    }

    // Send to restaurant
    if (notifyRestaurant) {
      try {
        await sendMessage(RESTAURANT_PHONE);
        results.push({ target: "restaurant", success: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("Restaurant WhatsApp failed:", msg);
        results.push({ target: "restaurant", success: false, error: msg });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-whatsapp error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
