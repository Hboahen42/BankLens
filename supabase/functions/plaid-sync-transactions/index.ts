import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAID_BASE_URL = "https://sandbox.plaid.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const requestId = crypto.randomUUID();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    let userId: string;
    const { connection_id, is_webhook_trigger } = await req.json();

    if (is_webhook_trigger && authHeader.replace("Bearer ", "") === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      // Get the user_id from the connection if not provided
      const { data: conn } = await supabase.from("plaid_connections").select("user_id").eq("id", connection_id).single();
      if (!conn) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      userId = conn.user_id;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      userId = user.id;
    }

    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from("plaid_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
    const PLAID_SECRET = Deno.env.get("PLAID_SECRET");

    if (!PLAID_CLIENT_ID || !PLAID_SECRET || connection.access_token.startsWith("mock-")) {
      return new Response(JSON.stringify({ success: true, message: "Mock sync completed (no real Plaid credentials)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let cursor = connection.next_cursor;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: connection.access_token,
          cursor: cursor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_message || "Plaid sync failed");
      }

      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }


    // Get accounts for this connection to map Plaid account_id to our internal uuid
    const { data: accounts } = await supabase
      .from("plaid_accounts")
      .select("id, account_id")
      .eq("connection_id", connection_id);

    const accountMap = new Map(accounts?.map(a => [a.account_id, a.id]));

    // 1. Handle Added
    for (const tx of added) {
      const internalAccountId = accountMap.get(tx.account_id);
      if (!internalAccountId) continue;

      const categoryStr = Array.isArray(tx.category) ? tx.category[0] : (tx.category || "Other");
      await supabase.from("plaid_transactions").upsert({
        account_id: internalAccountId,
        user_id: userId,
        transaction_id: tx.transaction_id,
        merchant_name: tx.merchant_name || tx.name,
        name: tx.name,
        amount: tx.amount,
        date: tx.date,
        category: categoryStr,
        pending: tx.pending || false,
        pending_transaction_id: tx.pending_transaction_id,
        currency_code: tx.iso_currency_code || "USD",
        updated_at: new Date().toISOString(),
      }, { onConflict: "transaction_id" });
    }

    // 2. Handle Modified
    for (const tx of modified) {
      const internalAccountId = accountMap.get(tx.account_id);
      if (!internalAccountId) continue;

      const categoryStr = Array.isArray(tx.category) ? tx.category[0] : (tx.category || "Other");
      await supabase.from("plaid_transactions").update({
        merchant_name: tx.merchant_name || tx.name,
        name: tx.name,
        amount: tx.amount,
        date: tx.date,
        category: categoryStr,
        pending: tx.pending || false,
        pending_transaction_id: tx.pending_transaction_id,
        updated_at: new Date().toISOString(),
      }).eq("transaction_id", tx.transaction_id);
    }

    // 3. Handle Removed
    for (const tx of removed) {
      await supabase.from("plaid_transactions").delete().eq("transaction_id", tx.transaction_id);
    }

    // Update cursor in database
    await supabase
      .from("plaid_connections")
      .update({ next_cursor: cursor, updated_at: new Date().toISOString() })
      .eq("id", connection_id);

    return new Response(JSON.stringify({
      success: true,
      summary: { added: added.length, modified: modified.length, removed: removed.length }
    }), {
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
