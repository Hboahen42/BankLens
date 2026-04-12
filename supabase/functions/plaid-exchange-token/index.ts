import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAID_BASE_URL = "https://sandbox.plaid.com";

const MOCK_INSTITUTIONS = [
  { id: "ins_1", name: "Chase", color: "#117ACA" },
  { id: "ins_2", name: "Bank of America", color: "#E31837" },
  { id: "ins_3", name: "Wells Fargo", color: "#D71E28" },
];

const MOCK_ACCOUNTS = [
  {
    account_id: "acc_checking_001",
    name: "Chase Checking",
    official_name: "Chase Total Checking",
    type: "depository",
    subtype: "checking",
    balances: { current: 5842.33, available: 5642.33, iso_currency_code: "USD" },
  },
  {
    account_id: "acc_savings_001",
    name: "Chase Savings",
    official_name: "Chase Savings Account",
    type: "depository",
    subtype: "savings",
    balances: { current: 12500.00, available: 12500.00, iso_currency_code: "USD" },
  },
];

const MOCK_TRANSACTIONS = [
  { transaction_id: "tx_001", name: "Starbucks Coffee", merchant_name: "Starbucks", amount: 6.75, date: "2024-05-28", category: "Food & Drink", pending: false },
  { transaction_id: "tx_002", name: "Uber", merchant_name: "Uber", amount: 18.50, date: "2024-05-27", category: "Transport", pending: false },
  { transaction_id: "tx_003", name: "Amazon.com", merchant_name: "Amazon", amount: 89.99, date: "2024-05-26", category: "Shopping", pending: false },
  { transaction_id: "tx_004", name: "Whole Foods Market", merchant_name: "Whole Foods", amount: 67.43, date: "2024-05-25", category: "Groceries", pending: false },
  { transaction_id: "tx_005", name: "Netflix", merchant_name: "Netflix", amount: 15.99, date: "2024-05-24", category: "Entertainment", pending: false },
  { transaction_id: "tx_006", name: "Spotify", merchant_name: "Spotify", amount: 9.99, date: "2024-05-23", category: "Entertainment", pending: false },
  { transaction_id: "tx_007", name: "Direct Deposit - Employer", merchant_name: "Employer", amount: -3500.00, date: "2024-05-22", category: "Income", pending: false },
  { transaction_id: "tx_008", name: "Shell Gas Station", merchant_name: "Shell", amount: 52.18, date: "2024-05-21", category: "Transport", pending: false },
  { transaction_id: "tx_009", name: "Trader Joe's", merchant_name: "Trader Joe's", amount: 43.21, date: "2024-05-20", category: "Groceries", pending: false },
  { transaction_id: "tx_010", name: "Apple Store", merchant_name: "Apple", amount: 129.00, date: "2024-05-19", category: "Shopping", pending: false },
  { transaction_id: "tx_011", name: "Chipotle", merchant_name: "Chipotle", amount: 12.45, date: "2024-05-18", category: "Food & Drink", pending: false },
  { transaction_id: "tx_012", name: "Lyft", merchant_name: "Lyft", amount: 22.75, date: "2024-05-17", category: "Transport", pending: false },
  { transaction_id: "tx_013", name: "Target", merchant_name: "Target", amount: 78.32, date: "2024-05-16", category: "Shopping", pending: false },
  { transaction_id: "tx_014", name: "Gym Membership", merchant_name: "Planet Fitness", amount: 24.99, date: "2024-05-15", category: "Health", pending: false },
  { transaction_id: "tx_015", name: "Electric Bill", merchant_name: "Con Edison", amount: 94.50, date: "2024-05-14", category: "Utilities", pending: false },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const requestId = crypto.randomUUID();
  const log = createLogger("plaid-exchange-token", requestId);

  log.info("Token exchange request received");

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
      log.warn("Unauthorized token exchange attempt", { error: authError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    log.info("User authenticated", { userId: user.id });

    const { public_token } = await req.json();

    const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
    const PLAID_SECRET = Deno.env.get("PLAID_SECRET");

    // Get user from public.users
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!publicUser) {
      log.warn("Public user record not found", { userId: user.id });
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    let accessToken: string;
    let itemId: string;
    let institution: { name: string; institution_id: string; color?: string };
    let accounts: typeof MOCK_ACCOUNTS;
    let transactions: typeof MOCK_TRANSACTIONS;
    let nextCursor: string | null = null;

    if (!PLAID_CLIENT_ID || !PLAID_SECRET || public_token.startsWith("mock-")) {
      log.info("Using mock Plaid data", { userId: user.id });
      accessToken = "mock-access-token-" + Date.now();
      itemId = "mock-item-" + Date.now();
      const mockInst = MOCK_INSTITUTIONS[0];
      institution = { name: mockInst.name, institution_id: mockInst.id, color: mockInst.color };
      accounts = MOCK_ACCOUNTS;
      transactions = MOCK_TRANSACTIONS;
    } else {
      log.info("Exchanging public token with Plaid", { userId: user.id });
      const exchangeResp = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          public_token,
        }),
      });
      const exchangeData = await exchangeResp.json();
      if (!exchangeResp.ok) {
        log.error("Plaid token exchange failed", { status: exchangeResp.status, plaidError: exchangeData });
        throw new Error(exchangeData.error_message || "Token exchange failed");
      }
      accessToken = exchangeData.access_token;
      itemId = exchangeData.item_id;
      log.info("Token exchanged with Plaid", { itemId });

      const itemResp = await fetch(`${PLAID_BASE_URL}/item/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, access_token: accessToken }),
      });
      const itemData = await itemResp.json();
      const institutionId = itemData.item?.institution_id;

      if (institutionId) {
        const instResp = await fetch(`${PLAID_BASE_URL}/institutions/get_by_id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, institution_id: institutionId, country_codes: ["US"] }),
        });
        const instData = await instResp.json();
        institution = { name: instData.institution?.name || "Unknown Bank", institution_id: institutionId };
      } else {
        institution = { name: "Unknown Bank", institution_id: "" };
      }

      const accountsResp = await fetch(`${PLAID_BASE_URL}/accounts/balance/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, access_token: accessToken }),
      });
      const accountsData = await accountsResp.json();
      accounts = accountsData.accounts || [];

      let added: any[] = [];
      let hasMore = true;
      let cursor: string | null = null;

      while (hasMore) {
        const syncResp = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: accessToken,
            cursor: cursor,
          }),
        });
        const syncData = await syncResp.json();
        if (!syncResp.ok) {
          log.error("Plaid transaction sync failed", {
            status: syncResp.status,
            plaidError: syncData,
          });
          throw new Error(syncData.error_message || "Transaction sync failed");
        }
        added = added.concat(syncData.added);
        hasMore = syncData.has_more;
        cursor = syncData.next_cursor;
      }
      transactions = added;
      nextCursor = cursor;
    }

    log.info("Saving Plaid connection to database", { userId: user.id, institution: institution.name });

    const { data: connection } = await supabase
      .from("plaid_connections")
      .insert({
        user_id: publicUser.id,
        access_token: accessToken,
        item_id: itemId,
        institution_id: institution.institution_id,
        institution_name: institution.name,
        institution_color: institution.color || "#00D4AA",
        next_cursor: nextCursor,
      })
      .select()
      .single();

    if (!connection) {
      throw new Error("Failed to save connection");
    }

    log.info("Connection saved", { connectionId: connection.id, institution: institution.name });

    // Save accounts
    let accountsSaved = 0;
    let txSavedTotal = 0;

    for (const acc of accounts) {
      const { data: savedAccount, error: accError } = await supabase
        .from("plaid_accounts")
        .insert({
          connection_id: connection.id,
          user_id: publicUser.id,
          account_id: acc.account_id,
          name: acc.name,
          official_name: acc.official_name,
          type: acc.type,
          subtype: acc.subtype,
          current_balance: acc.balances?.current,
          available_balance: acc.balances?.available,
          currency_code: acc.balances?.iso_currency_code || "USD",
        })
        .select()
        .single();

      if (accError) {
        log.error("Failed to save account", { accountId: acc.account_id, error: accError.message });
      }

      if (savedAccount) {
        accountsSaved++;
        const accTransactions = transactions
            .filter((tx: any) => !tx.account_id || tx.account_id === acc.account_id)
            .slice(0, 15);

        let txSaved = 0;
        for (const tx of accTransactions) {
          const categoryStr = Array.isArray(tx.category) ? tx.category[0] : (tx.category || "Other");
          const { error: txError } = await supabase.from("plaid_transactions").insert({
            account_id: savedAccount.id,
            user_id: publicUser.id,
            transaction_id: tx.transaction_id,
            merchant_name: tx.merchant_name || tx.name,
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
            category: categoryStr,
            pending: tx.pending || false,
            pending_transaction_id: tx.pending_transaction_id,
          });
          if (txError) {
            log.warn("Failed to save transaction", { transactionId: tx.transaction_id, error: txError.message });
          } else {
            txSaved++;
          }
        }
        txSavedTotal += txSaved;
      }
    }

    log.info("Bank connected successfully", {
      userId: user.id,
      institution: institution.name,
      accountsSaved,
      transactionsSaved: txSavedTotal,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log.error("Unhandled exception during token exchange", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
