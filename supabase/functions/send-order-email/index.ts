import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusMessages: Record<string, { subject: string; emoji: string; heading: string; body: string }> = {
  processing: {
    subject: "Your order is being prepared! 👨‍🍳",
    emoji: "👨‍🍳",
    heading: "Your Order is Being Prepared",
    body: "Great news! Our kitchen team has started preparing your order. We'll notify you once it's on its way.",
  },
  "out-for-delivery": {
    subject: "Your order is on its way! 🚗",
    emoji: "🚗",
    heading: "Your Order is Out for Delivery",
    body: "Your food is on its way to you! Please ensure someone is available to receive it at the delivery address.",
  },
  delivered: {
    subject: "Your order has been delivered! ✅",
    emoji: "✅",
    heading: "Order Delivered",
    body: "Your order has been delivered. We hope you enjoy your meal! Thank you for choosing us. 🍽️",
  },
};

function buildEmailHtml(order: {
  order_number: string;
  customer_name: string;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  restaurant_name?: string;
}) {
  const info = statusMessages[order.status];
  if (!info) return null;

  const restaurant = order.restaurant_name || "Bellefood";
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.name} × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">₦${(i.price * i.quantity).toLocaleString()}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
<div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
<div style="background:#e67e22;padding:30px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:24px">${info.emoji} ${info.heading}</h1>
</div>
<div style="padding:30px">
<p style="color:#333;font-size:16px;margin:0 0 20px">Hi ${order.customer_name},</p>
<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 25px">${info.body}</p>
<div style="background:#fef9f3;border-radius:8px;padding:20px;margin:0 0 25px">
<h3 style="margin:0 0 15px;color:#333;font-size:14px">Order #${order.order_number}</h3>
<table style="width:100%;border-collapse:collapse;font-size:14px;color:#555">${itemsHtml}
<tr><td style="padding:12px 0;font-weight:bold;color:#333">Total</td><td style="padding:12px 0;font-weight:bold;color:#e67e22;text-align:right;font-size:16px">₦${order.total.toLocaleString()}</td></tr>
</table>
</div>
<p style="color:#999;font-size:12px;margin:0;text-align:center">Thank you for ordering from ${restaurant}!</p>
</div>
</div>
</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, customer_name, customer_email, status, items, total, restaurant_name } = await req.json();

    if (!customer_email || !status || !order_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml({ order_number, customer_name, status, items: items || [], total: total || 0, restaurant_name });
    if (!html) {
      return new Response(JSON.stringify({ error: "Unknown status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const info = statusMessages[status];

    // Use Supabase's built-in SMTP to send via the auth admin
    // We'll use a simple fetch to a public email API or the Resend connector
    // For now, use the Lovable AI gateway isn't an email service, so let's use Resend via connector
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      // Fallback: just log and return success so the admin flow doesn't break
      console.log(`Email would be sent to ${customer_email}: ${info.subject}`);
      return new Response(JSON.stringify({ success: true, message: "Email service not configured, logged instead" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${restaurant_name || "Bellefood"} <onboarding@resend.dev>`,
        to: [customer_email],
        subject: info.subject,
        html,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: response.ok, result }), {
      status: response.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-order-email error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
