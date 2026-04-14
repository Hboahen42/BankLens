"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "../../../supabase/client";

import ConnectBankHero from "@/components/banklens/connect-bank-hero";
import BalanceCards from "@/components/banklens/balance-cards";
import TransactionPanel from "@/components/banklens/transaction-panel";
import { Toaster } from "@/components/ui/sonner";

interface Account {
  id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype: string;
  current_balance: number;
  available_balance?: number;
  currency_code: string;
  connection?: {
    institution_name: string;
    institution_color: string;
  };
}

interface Transaction {
  id: string;
  merchant_name?: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  pending: boolean;
  currency_code?: string;
}

const PAGE_SIZE = 20;

export default function BankLensDashboard() {
  const supabase = createClient();

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const getPublicUserId = useCallback(async (authUserId: string) => {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", authUserId)
      .single();
    if (!data) return null;
    return data?.id || null;
  }, [supabase]);

  const fetchAccounts = useCallback(async (pubUserId: string) => {
    const { data, error } = await supabase
      .from("plaid_accounts")
      .select(`
        id, name, official_name, type, subtype,
        current_balance, available_balance, currency_code,
        connection:plaid_connections(institution_name, institution_color)
      `)
      .eq("user_id", pubUserId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
      return false;
    }

    if (data && data.length > 0) {
      setAccounts(
        data.map((a) => ({
          ...a,
          connection: Array.isArray(a.connection) ? a.connection[0] : a.connection,
        })) as Account[]
      );
      return true;
    }
    return false;
  }, [supabase]);

  const fetchTransactions = useCallback(
    async (pubUserId: string, offset = 0, append = false) => {
      setTxLoading(!append);
      const { data, error } = await supabase
        .from("plaid_transactions")
        .select("id, merchant_name, name, amount, date, category, category_icon, pending, currency_code")
        .eq("user_id", pubUserId)
        .order("date", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching transactions:", error);
        if(!append) setTransactions([]);
        setHasMore(false);
        setTxLoading(false);
        return;
      }

      if (data) {
        if (append) {
          setTransactions((prev) => [...prev, ...data]);
        } else {
          setTransactions(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setTxOffset(offset + data.length);
      }
      setTxLoading(false);
    },
    [supabase]
  );

  const checkConnection = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsConnected(false);
      setAccounts([]);
      setTransactions([]);
      return;
    }

    const pubId = await getPublicUserId(user.id);
    if (!pubId) return;
    setUserId(pubId);

    const hasAccounts = await fetchAccounts(pubId);
    setIsConnected(hasAccounts);
    if (hasAccounts) {
      await fetchTransactions(pubId, 0, false);
    } else {
    }
  }, [supabase, getPublicUserId, fetchAccounts, fetchTransactions]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleConnected = useCallback(async () => {
    setIsConnected(null); // loading state
    await checkConnection();
  }, [checkConnection]);

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    await fetchAccounts(userId);
  }, [userId, fetchAccounts]);

  const handleLoadMore = useCallback(async () => {
    if (!userId || !hasMore) return;
    await fetchTransactions(userId, txOffset, true);
  }, [userId, txOffset, hasMore, fetchTransactions]);

  return (
    <>
      <div
        className="banklens-bg min-h-screen"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 relative z-10">
          {/* Loading state (initial check) */}
          {isConnected === null && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(0,212,170,0.3)", borderTopColor: "#00D4AA" }}
              />
              <p
                className="mt-4 text-sm"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Loading your data…
              </p>
            </div>
          )}

          {/* Pre-connection state */}
          {isConnected === false && (
            <ConnectBankHero onConnected={handleConnected} />
          )}

          {/* Connected dashboard */}
          {isConnected === true && (
            <div className="flex flex-col gap-8">
              <BalanceCards accounts={accounts} onRefresh={handleRefresh} />
              <TransactionPanel
                transactions={transactions}
                loading={txLoading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          )}
        </main>
      </div>
      <Toaster
        toastOptions={{
          style: {
            backgroundColor: "#181C27",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            fontFamily: "Space Grotesk, sans-serif",
          },
        }}
      />
    </>
  );
}
