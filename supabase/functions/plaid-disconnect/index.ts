import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const redactId = (id: string) => `${id.slice(0, 4)}...${id.slice(-4)}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const requestId = crypto.randomUUID();
  const log = createLogger("plaid-disconnect", requestId);

  log.info("Disconnect request received");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log.warn("Request missing Authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      log.warn("Unauthorized disconnect attempt", { error: authError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    log.info("User authenticated", { userId: redactId(user.id) });

    // Get user from public.users
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!publicUser) {
      log.warn("Public user record not found", { userId: redactId(user.id) });
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    log.info("Deleting Plaid connections", { userId: redactId(user.id), publicUserId: redactId(publicUser.id) });

    const { error: deleteError, count } = await supabase
      .from("plaid_connections")
      .delete({ count: "exact" })
      .eq("user_id", publicUser.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    log.info("Bank disconnected successfully", { userId: redactId(user.id), deletedCount: count });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    log.error("Unhandled exception during disconnect", { error: message, stack });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
