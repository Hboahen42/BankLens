import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

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
  const log = createLogger("plaid-webhook", requestId);

  log.info("Webhook received");

  try {
    // Verify Plaid webhook signature before processing
    const plaidWebhookSecret = Deno.env.get("PLAID_WEBHOOK_SECRET");
    let body;

    if (plaidWebhookSecret) {
      const signature = req.headers.get("Plaid-Verification");

      if (!signature) {
        log.warn("Missing Plaid-Verification header");
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
          log.warn("Invalid JWT format in Plaid-Verification header");
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid JWT format" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        const header = JSON.parse(atob(jwtParts[0]));
        const payload = JSON.parse(atob(jwtParts[1]));
        const kid = header.kid;

        if (!kid) {
          log.warn("Missing kid in JWT header");
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

        log.debug("Fetching JWK from Plaid", { kid, plaidEnv });

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
          log.error("Failed to fetch JWK from Plaid", { status: jwkResponse.status });
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
          log.warn("Invalid JWT signature on webhook");
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid signature" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        // Validate JWT iat is within 5 minutes
        const now = Math.floor(Date.now() / 1000);
        const iat = payload.iat;
        if (!iat || Math.abs(now - iat) > 300) {
          log.warn("JWT timestamp out of range", { iat, now, diff: Math.abs(now - iat) });
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
          log.warn("Webhook body hash mismatch");
          return new Response(JSON.stringify({ error: "Unauthorized: Body hash mismatch" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          });
        }

        log.info("Webhook signature verified");

        // Parse body after verification
        body = JSON.parse(rawBody);
      } catch (verificationError) {
        log.error("JWT verification exception", { error: verificationError instanceof Error ? verificationError.message : String(verificationError) });
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
        log.warn("Processing webhook without signature verification (dev/insecure mode)");
        body = await req.json();
      } else {
        log.error("PLAID_WEBHOOK_SECRET not configured and not in development mode");
        return new Response(JSON.stringify({ error: "Webhook signature verification required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
    }

    const { webhook_type, webhook_code, item_id } = body;

    log.info("Webhook payload parsed", { webhook_type, webhook_code, item_id });

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
        log.warn("Connection not found for item_id", { item_id });
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      log.info("Triggering transaction sync", { connectionId: connection.id });

      const syncFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/plaid-sync-transactions`;

      const response = await fetch(syncFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ connection_id: connection.id, is_webhook_trigger: true }),
      });

      const syncResult = await response.json();

      if (!response.ok || (syncResult && syncResult.error)) {
        log.error("Transaction sync failed", { status: response.status, error: syncResult.error });
        return new Response(JSON.stringify({
          error: "Sync failed",
          details: syncResult.error || `HTTP ${response.status}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status || 500,
        });
      }

      log.info("Transaction sync triggered successfully", { connectionId: connection.id });
    } else {
      log.debug("Unhandled webhook type/code — acknowledging", { webhook_type, webhook_code });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    log.error("Unhandled exception", { error: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});