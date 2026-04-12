import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const requestId = crypto.randomUUID();

  try {
    // Verify Plaid webhook signature before processing
    const plaidWebhookSecret = Deno.env.get("PLAID_WEBHOOK_SECRET");
    let body;

    if (plaidWebhookSecret) {
      const signature = req.headers.get("Plaid-Verification");

      if (!signature) {
        console.error(`[${requestId}] Missing Plaid-Verification header`);
        return new Response(JSON.stringify({ error: "Unauthorized: Missing signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Read the raw body for signature verification
      const rawBody = await req.text();

      // Verify HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(plaidWebhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(rawBody)
      );

      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== computedSignature) {
        console.error(`[${requestId}] Invalid webhook signature`);
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Parse body after verification
      body = JSON.parse(rawBody);
    } else {
      // No signature verification configured
      body = await req.json();
    }

    const { webhook_type, webhook_code, item_id } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (webhook_type === "TRANSACTIONS" && webhook_code === "SYNC_UPDATES_AVAILABLE") {
      // Find the connection for this item_id
      const { data: connection, error: connError } = await supabase
        .from("plaid_connections")
        .select("id, user_id")
        .eq("item_id", item_id)
        .single();

      if (connError || !connection) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Instead of duplicating sync logic, we'll call the existing sync function locally
      // or just re-implement the sync logic here if we want to avoid HTTP overhead.
      // For simplicity and directness, we'll trigger the sync.
      
      const syncFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/plaid-sync-transactions`;
      
      // We need a way to authenticate this call. Since it's internal (Edge Function to Edge Function),
      // we can't easily use the user's JWT. 
      // However, the plaid-sync-transactions function currently expects an Auth header.
      // We'll update plaid-sync-transactions to also accept a service role key or just handle it here.
      
      // For now, let's log that we would trigger it. In a real scenario, we'd either:
      // 1. Refactor sync logic into a shared module.
      // 2. Make the sync function accept a service role key.
      
      // Let's refactor the sync logic into a shared place or just call it.
      // Given Deno environment constraints, we'll try to invoke it with the service role.
      
      const response = await fetch(syncFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ connection_id: connection.id, is_webhook_trigger: true }),
      });

      const syncResult = await response.json();

      // Check if sync was successful
      if (!response.ok || (syncResult && syncResult.error)) {
        console.error(`[${requestId}] Sync failed:`, syncResult);
        return new Response(JSON.stringify({
          error: "Sync failed",
          details: syncResult.error || `HTTP ${response.status}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status || 500,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});