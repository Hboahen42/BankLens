"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "../../../supabase/client";
import AppShell from "@/components/banklens/app-shell";
import ConnectBankHero from "@/components/banklens/connect-bank-hero";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { RefreshCw, TrendingDown, TrendingUp, Wallet, CreditCard } from "lucide-react";

interface Account {
  id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype: string;
  current_balance: number;
  available_balance?: number;
  currency_code: string;
  connection?: { institution_name: string; institution_color: string };
}

interface Transaction {
  id: string;
  merchant_name?: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  pending: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#00D4AA",
  Transport: "#7B61FF",
  Shopping: "#FF6B6B",
  Entertainment: "#FFB347",
  Utilities: "#4FC3F7",
  Health: "#81C784",
  Other: "rgba(255,255,255,0.3)",
};

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  trend?: "up" | "down";
}) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        backgroundColor: "#181C27",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#fff" }}>
          {value}
        </p>
        {sub && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && <TrendingUp size={12} style={{ color: "#00D4AA" }} />}
            {trend === "down" && <TrendingDown size={12} style={{ color: "#FF6B6B" }} />}
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardOverviewProps {
  userEmail?: string;
}

export default function DashboardOverview({ userEmail }: DashboardOverviewProps) {
  const supabase = createClient();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getPublicUserId = useCallback(async (authId: string) => {
    const { data } = await supabase.from("users").select("id").eq("user_id", authId).single();
    return data?.id || null;
  }, [supabase]);

  const fetchAccounts = useCallback(async (pubId: string) => {
    const { data } = await supabase
      .from("plaid_accounts")
      .select(`id, name, official_name, type, subtype, current_balance, available_balance, currency_code, connection:plaid_connections(institution_name, institution_color)`)
      .eq("user_id", pubId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setAccounts(data.map((a) => ({ ...a, connection: Array.isArray(a.connection) ? a.connection[0] : a.connection })) as Account[]);
      return true;
    }
    return false;
  }, [supabase]);

  const fetchTransactions = useCallback(async (pubId: string) => {
    const { data } = await supabase
      .from("plaid_transactions")
      .select("id, merchant_name, name, amount, date, category, pending")
      .eq("user_id", pubId)
      .order("date", { ascending: false })
      .limit(100);
    if (data) setTransactions(data);
  }, [supabase]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsConnected(false); return; }
    const pubId = await getPublicUserId(user.id);
    if (!pubId) { setIsConnected(false); return; }
    setUserId(pubId);
    const has = await fetchAccounts(pubId);
    setIsConnected(has);
    if (has) await fetchTransactions(pubId);
  }, [supabase, getPublicUserId, fetchAccounts, fetchTransactions]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchAccounts(userId);
    await fetchTransactions(userId);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccounts([]);
    setTransactions([]);
  };

  // Derived stats
  const totalBalance = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalSpend30 = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && t.amount > 0;
    })
    .reduce((s, t) => s + t.amount, 0);
  const income30 = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && t.amount < 0;
    })
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Spending chart — last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.toISOString().split("T")[0];
    const spent = transactions
      .filter((t) => t.date === dateStr && t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    return { day: label, amount: spent };
  });

  // Category breakdown
  const catMap: Record<string, number> = {};
  transactions.filter((t) => t.amount > 0).forEach((t) => {
    const cat = t.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + t.amount;
  });
  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Recent transactions
  const recent = transactions.slice(0, 6);

  return (
    <>
      <div className="banklens-bg min-h-screen" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        {isConnected === null && (
          <AppShell userEmail={userEmail} isConnected={false}>
            <div className="flex items-center justify-center min-h-screen">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,212,170,0.3)", borderTopColor: "#00D4AA" }} />
            </div>
          </AppShell>
        )}

        {isConnected === false && (
          <AppShell userEmail={userEmail} isConnected={false}>
            <div className="flex items-center justify-center min-h-screen px-8">
              <ConnectBankHero onConnected={() => load()} />
            </div>
          </AppShell>
        )}

        {isConnected === true && (
          <AppShell userEmail={userEmail} isConnected={true} onDisconnect={handleDisconnect}>
            <div className="p-8 max-w-[1400px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fff" }}>
                    Overview
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: "rgba(0,212,170,0.1)", color: "#00D4AA", border: "1px solid rgba(0,212,170,0.2)" }}
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Balance" value={fmt.format(totalBalance)} icon={Wallet} color="#00D4AA" sub="Across all accounts" trend="up" />
                <StatCard label="Spending (30d)" value={fmt.format(totalSpend30)} icon={TrendingDown} color="#FF6B6B" sub="Last 30 days" trend="down" />
                <StatCard label="Income (30d)" value={fmt.format(income30)} icon={TrendingUp} color="#7B61FF" sub="Last 30 days" trend="up" />
                <StatCard label="Accounts" value={String(accounts.length)} icon={CreditCard} color="#FFB347" sub={`${accounts.map(a => a.subtype).join(", ")}`} />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                {/* Spending trend */}
                <div
                  className="lg:col-span-2 rounded-2xl p-6"
                  style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Daily Spending — Last 7 Days
                  </h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1E2334", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Space Grotesk", color: "#fff" }}
                        formatter={(v: number) => [fmt.format(v), "Spent"]}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#00D4AA" strokeWidth={2} fill="url(#spendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Category pie */}
                <div
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Spending by Category
                  </h2>
                  {catData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                            {catData.map((entry, i) => (
                              <Cell key={i} fill={Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1E2334", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Space Grotesk", color: "#fff" }}
                            formatter={(v: number) => [fmt.format(v)]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1.5 mt-2">
                        {catData.map((c, i) => (
                          <div key={c.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length] }} />
                              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{c.name}</span>
                            </div>
                            <span className="text-xs font-medium" style={{ fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.8)" }}>{fmt.format(c.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-center mt-8" style={{ color: "rgba(255,255,255,0.3)" }}>No category data</p>
                  )}
                </div>
              </div>

              {/* Bottom row: accounts + recent transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Accounts */}
                <div
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Connected Accounts
                  </h2>
                  <div className="flex flex-col gap-3">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: acc.connection?.institution_color
                                ? `${acc.connection.institution_color}22`
                                : "rgba(0,212,170,0.15)",
                              color: acc.connection?.institution_color || "#00D4AA",
                              fontFamily: "Syne",
                            }}
                          >
                            {(acc.connection?.institution_name || acc.name).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#fff" }}>{acc.name}</p>
                            <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{acc.connection?.institution_name || ""} · {acc.subtype}</p>
                          </div>
                        </div>
                        <p
                          className="text-base font-bold"
                          style={{ fontFamily: "JetBrains Mono, monospace", color: acc.current_balance >= 0 ? "#00D4AA" : "#FF6B6B" }}
                        >
                          {fmt.format(acc.current_balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent transactions */}
                <div
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h2 className="text-sm font-semibold mb-5 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Recent Transactions
                  </h2>
                  <div className="flex flex-col gap-2">
                    {recent.length === 0 ? (
                      <p className="text-sm text-center mt-8" style={{ color: "rgba(255,255,255,0.3)" }}>No transactions yet</p>
                    ) : (
                      recent.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-3 px-3 rounded-xl transition-all cursor-pointer"
                          style={{ border: "1px solid transparent" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: `${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other}18`, color: CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other }}>
                              {(tx.merchant_name || tx.name).slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>{tx.merchant_name || tx.name}</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                            </div>
                          </div>
                          <span
                            className="text-sm font-semibold"
                            style={{ fontFamily: "JetBrains Mono", color: tx.amount > 0 ? "#FF6B6B" : "#00D4AA" }}
                          >
                            {tx.amount > 0 ? "−" : "+"}{fmt.format(Math.abs(tx.amount))}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </AppShell>
        )}
      </div>
      <Toaster toastOptions={{ style: { backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontFamily: "Space Grotesk" } }} />
    </>
  );
}
