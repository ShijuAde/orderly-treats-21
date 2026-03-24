import { supabase } from "@/integrations/supabase/client";

export async function notifyNewOrder(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}) {
  const itemsList = order.items
    .map((i) => `• ${i.name} × ${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`)
    .join("\n");

  const message = `🔔 *New Order Received!*\n\nOrder: ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.customerAddress}\n\n${itemsList}\n\n*Total: ₦${order.total.toLocaleString()}*`;

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { message, notifyRestaurant: true },
    });
    if (error) console.error("WhatsApp notify error:", error);
    return data;
  } catch (e) {
    console.error("WhatsApp notify failed:", e);
  }
}

export async function notifyOrderStatus(
  customerPhone: string,
  orderId: string,
  status: string
) {
  const statusMessages: Record<string, string> = {
    processing: `👨‍🍳 *Order Update*\n\nYour order *${orderId}* is now being prepared! We'll let you know when it's on its way.`,
    "out-for-delivery": `🚗 *Order Update*\n\nGreat news! Your order *${orderId}* is out for delivery. It will arrive shortly!`,
    delivered: `✅ *Order Delivered*\n\nYour order *${orderId}* has been delivered. Enjoy your meal! 🍽️\n\nWe'd love your feedback at bellefood.`,
  };

  const message = statusMessages[status];
  if (!message) return;

  // Normalize phone to E.164
  let phone = customerPhone.replace(/\s+/g, "");
  if (phone.startsWith("0")) {
    phone = "+234" + phone.slice(1);
  } else if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { to: phone, message },
    });
    if (error) console.error("WhatsApp status error:", error);
    return data;
  } catch (e) {
    console.error("WhatsApp status failed:", e);
  }
}
