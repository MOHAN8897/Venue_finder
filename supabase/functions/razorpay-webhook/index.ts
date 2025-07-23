import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

function verifySignature(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(body);
  return crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  ).then(cryptoKey =>
    crypto.subtle.verify("HMAC", cryptoKey, hexToBytes(signature), data)
  );
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const valid = await verifySignature(body, signature, WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Parse event and process (expand as needed)
  const event = JSON.parse(body);

  // TODO: Call Supabase RPC or direct SQL to update payment/booking status
  // Example: await fetch(SUPABASE_URL + "/rest/v1/rpc/process_razorpay_webhook", ...)

  return new Response("Webhook processed", { status: 200 });
}); 