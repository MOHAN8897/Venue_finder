// @ts-nocheck
// Disable JWT verification for public payment processing
// supabase:function-config verify_jwt=false

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Log incoming request for debugging
  console.log('Incoming request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Check if Razorpay credentials are configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Payment service not configured" 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { amount, currency, receipt, notes } = await req.json();
    
    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid amount" 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Creating Razorpay order: amount=${amount}, currency=${currency}, receipt=${receipt}`);

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
      console.error("Razorpay API error:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.description || "Failed to create order" 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Razorpay order created successfully:", data.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        order: data 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 