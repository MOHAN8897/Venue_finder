// supabase/functions/razorpay-webhook.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Async signature verification using HMAC-SHA256
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(body);
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const actual = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return actual === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const isValid = await verifySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentId = event.payload?.payment?.entity?.id || null;
    const orderId = event.payload?.payment?.entity?.order_id || null;
    // Log the webhook event to payment_webhooks table
    await fetch(`${SUPABASE_URL}/rest/v1/payment_webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        gateway_name: 'razorpay',
        event_type: eventType,
        event_id: event.id,
        payload: event,
        processed: false
      })
    });
    // Optionally, update payment/booking status via Supabase RPC or direct update
    // ...
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}); 