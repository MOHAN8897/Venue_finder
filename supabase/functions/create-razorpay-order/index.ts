import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { amount, currency, receipt, notes } = await req.json();

  // Create order in Razorpay
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount, // in paise
      currency: currency || "INR",
      receipt,
      notes
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ success: false, error: data }), { status: 400 });
  }
  return new Response(JSON.stringify({ success: true, order: data }), { status: 200 });
}); 