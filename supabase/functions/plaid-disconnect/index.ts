import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createLogger("plaid-disconnect");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const requestId = crypto.randomUUID();
  logger.info("Request received", { requestId, method: req.method });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn("Missing authorization header", { requestId });
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      logger.warn("Authentication failed", { requestId, error: authError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    logger.info("User authenticated", { requestId, userId: user.id });

    // Get user from public.users
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!publicUser) {
      logger.error("Public user record not found", { requestId, userId: user.id });
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logger.debug("Deleting plaid_connections for user", { requestId, publicUserId: publicUser.id });

    const { error: deleteError, count } = await supabase
      .from("plaid_connections")
      .delete({ count: "exact" })
      .eq("user_id", publicUser.id);

    if (deleteError) {
      logger.error("Failed to delete connections", { requestId, publicUserId: publicUser.id, error: deleteError.message });
      throw new Error(deleteError.message);
    }

    logger.info("Bank disconnected successfully", { requestId, userId: user.id, connectionsDeleted: count ?? 0 });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logger.error("Unhandled exception", { requestId, error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
