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

      // Verify JWT ES256 signature
      try {
        // Decode JWT header to get kid
        const jwtParts = signature.split('.');
        if (jwtParts.length !== 3) {
          console.error(`[${requestId}] Invalid JWT format`);
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid JWT format" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        const header = JSON.parse(atob(jwtParts[0]));
        const payload = JSON.parse(atob(jwtParts[1]));
        const kid = header.kid;

        if (!kid) {
          console.error(`[${requestId}] Missing kid in JWT header`);
          return new Response(JSON.stringify({ error: "Unauthorized: Missing kid" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        // Fetch the JWK from Plaid
        const plaidEnv = Deno.env.get("PLAID_ENV") || Deno.env.get("PLAID_ENVIRONMENT") || "sandbox";
        const plaidBaseUrl = (() => {
          switch (plaidEnv.toLowerCase()) {
            case "production":
              return "https://production.plaid.com";
            case "development":
              return "https://development.plaid.com";
            case "sandbox":
            default:
              return "https://sandbox.plaid.com";
          }
        })();

        const jwkResponse = await fetch(`${plaidBaseUrl}/webhook_verification_key/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: Deno.env.get("PLAID_CLIENT_ID"),
            secret: plaidWebhookSecret,
            key_id: kid,
          }),
        });

        if (!jwkResponse.ok) {
          console.error(`[${requestId}] Failed to fetch JWK from Plaid`);
          return new Response(JSON.stringify({ error: "Unauthorized: Failed to fetch verification key" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        const jwkData = await jwkResponse.json();
        const jwk = jwkData.key;

        // Import the JWK as a public key for ES256 verification
        const publicKey = await crypto.subtle.importKey(
          "jwk",
          jwk,
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["verify"]
        );

        // Verify JWT signature
        const encoder = new TextEncoder();
        const signatureData = jwtParts[0] + '.' + jwtParts[1];
        const signatureBytes = new Uint8Array(
          atob(jwtParts[2].replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => c.charCodeAt(0))
        );

        const isValidSignature = await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          publicKey,
          signatureBytes,
          encoder.encode(signatureData)
        );

        if (!isValidSignature) {
          console.error(`[${requestId}] Invalid JWT signature`);
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid signature" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        // Validate JWT iat is within 5 minutes
        const now = Math.floor(Date.now() / 1000);
        const iat = payload.iat;
        if (!iat || Math.abs(now - iat) > 300) {
          console.error(`[${requestId}] JWT timestamp out of range`);
          return new Response(JSON.stringify({ error: "Unauthorized: JWT timestamp out of range" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        // Compute SHA-256 of rawBody and compare to request_body_sha256
        const bodyHash = await crypto.subtle.digest("SHA-256", encoder.encode(rawBody));
        const bodyHashHex = Array.from(new Uint8Array(bodyHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (payload.request_body_sha256 !== bodyHashHex) {
          console.error(`[${requestId}] Body hash mismatch`);
          return new Response(JSON.stringify({ error: "Unauthorized: Body hash mismatch" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        // Parse body after verification
        body = JSON.parse(rawBody);
      } catch (verificationError) {
        console.error(`[${requestId}] JWT verification error:`, verificationError);
        return new Response(JSON.stringify({ error: "Unauthorized: Verification failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
    } else {
      // Fail closed: only allow unverified requests in development with explicit override
      const nodeEnv = Deno.env.get("NODE_ENV");
      const allowInsecure = Deno.env.get("PLAID_WEBHOOK_ALLOW_INSECURE");

      if (nodeEnv === "development" || allowInsecure === "true") {
        console.warn(`[${requestId}] Processing webhook without signature verification (dev mode)`);
        body = await req.json();
      } else {
        console.error(`[${requestId}] Missing PLAID_WEBHOOK_SECRET and not in development mode`);
        return new Response(JSON.stringify({ error: "Webhook signature verification required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
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