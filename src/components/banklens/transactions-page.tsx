"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "../../../supabase/client";
import AppShell from "@/components/banklens/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

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

const CATEGORIES = ["All", "Food", "Transport", "Shopping", "Entertainment", "Utilities", "Health", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#00D4AA",
  Transport: "#7B61FF",
  Shopping: "#FF6B6B",
  Entertainment: "#FFB347",
  Utilities: "#4FC3F7",
  Health: "#81C784",
  Other: "rgba(255,255,255,0.3)",
};

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const PAGE_SIZE = 25;

interface TransactionsPageProps {
  userEmail?: string;
}

export default function TransactionsPage({ userEmail }: TransactionsPageProps) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPublicUserId = useCallback(async (authId: string) => {
    const { data } = await supabase.from("users").select("id").eq("user_id", authId).single();
    return data?.id || null;
  }, [supabase]);

  const fetchTx = useCallback(async (pubId: string, off = 0, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    const { data } = await supabase
      .from("plaid_transactions")
      .select("id, merchant_name, name, amount, date, category, pending, currency_code")
      .eq("user_id", pubId)
      .order("date", { ascending: false })
      .range(off, off + PAGE_SIZE - 1);
    if (data) {
      if (append) setTransactions((prev) => [...prev, ...data]);
      else setTransactions(data);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(off + data.length);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const pubId = await getPublicUserId(user.id);
      if (!pubId) return;
      setUserId(pubId);
      await fetchTx(pubId, 0, false);
    })();
  }, [supabase, getPublicUserId, fetchTx]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && userId) {
        fetchTx(userId, offset, true);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, offset, userId, fetchTx]);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  };

  const filtered = transactions.filter((t) => {
    const matchCat = activeCategory === "All" || (t.category || "Other") === activeCategory;
    const matchSearch = search === "" ||
      (t.merchant_name || t.name).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Monthly spending chart
  const monthlyMap: Record<string, number> = {};
  transactions.filter((t) => t.amount > 0).forEach((t) => {
    const m = t.date.slice(0, 7);
    monthlyMap[m] = (monthlyMap[m] || 0) + t.amount;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, amount]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      amount,
    }));

  return (
    <>
      <div className="banklens-bg min-h-screen" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        <AppShell userEmail={userEmail}>
          <div className="p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fff" }}>
                Transactions
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                All your spending in one place
              </p>
            </div>

            {/* Monthly bar chart */}
            {monthlyData.length > 0 && (
              <div
                className="rounded-2xl p-6 mb-6"
                style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Monthly Spending
                </h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={monthlyData} barSize={28}>
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1E2334", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Space Grotesk", color: "#fff" }}
                      formatter={(v: number) => [fmt.format(v), "Spent"]}
                    />
                    <Bar dataKey="amount" fill="#00D4AA" radius={[6, 6, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="text"
                  placeholder="Search merchants…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: "#181C27",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "Space Grotesk",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: activeCategory === cat ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.05)",
                      color: activeCategory === cat ? "#00D4AA" : "rgba(255,255,255,0.45)",
                      border: activeCategory === cat ? "1px solid rgba(0,212,170,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions table */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Table header */}
              <div
                className="grid grid-cols-[1fr_140px_120px_100px] px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span>Merchant</span>
                <span>Date</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
              </div>

              {loading ? (
                <div className="flex flex-col gap-0">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_120px_100px] px-5 py-4 gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                        <div className="w-32 h-3 rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                      </div>
                      <div className="w-20 h-3 rounded animate-pulse my-auto" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                      <div className="w-16 h-5 rounded-full animate-pulse my-auto" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                      <div className="w-16 h-3 rounded animate-pulse my-auto ml-auto" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No transactions found</p>
                  {(search || activeCategory !== "All") && (
                    <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="text-xs" style={{ color: "#00D4AA" }}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((tx, i) => {
                  const cat = tx.category || "Other";
                  const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[1fr_140px_120px_100px] px-5 py-4 transition-all cursor-pointer"
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      {/* Merchant */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ backgroundColor: `${catColor}18`, color: catColor }}
                        >
                          {(tx.merchant_name || tx.name).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {tx.merchant_name || tx.name}
                          </p>
                          {tx.pending && (
                            <span className="text-xs" style={{ color: "#FFB347" }}>Pending</span>
                          )}
                        </div>
                      </div>
                      {/* Date */}
                      <span className="text-sm my-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {/* Category */}
                      <div className="my-auto">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${catColor}18`, color: catColor }}
                        >
                          {cat}
                        </span>
                      </div>
                      {/* Amount */}
                      <span
                        className="text-sm font-semibold text-right my-auto"
                        style={{ fontFamily: "JetBrains Mono", color: tx.amount > 0 ? "#FF6B6B" : "#00D4AA" }}
                      >
                        {tx.amount > 0 ? "−" : "+"}{fmt.format(Math.abs(tx.amount))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
              {loadingMore && (
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,212,170,0.3)", borderTopColor: "#00D4AA" }} />
              )}
              {!hasMore && filtered.length > 0 && !loading && (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>All transactions loaded</p>
              )}
            </div>
          </div>
        </AppShell>
      </div>
      <Toaster toastOptions={{ style: { backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" } }} />
    </>
  );
}
