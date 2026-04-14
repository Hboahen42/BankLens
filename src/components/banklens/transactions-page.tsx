"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "../../../supabase/client";
import AppShell from "@/components/banklens/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { Search, ChevronDown, Calendar, CheckCircle2, CreditCard, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  category_icon?: string;
  pending: boolean;
  currency_code?: string;
  account_id?: string;
}

interface Account {
  id: string;
  name: string;
}

const CATEGORIES = [
  "All",
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Health",
  "Travel",
  "Home",
  "Personal Care",
  "Services",
  "Government",
  "Income",
  "Transfer",
  "Loan",
  "Fees",
  "Other"
];
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#00D4AA",
  Transport: "#7B61FF",
  Shopping: "#FF6B6B",
  Entertainment: "#FFB347",
  Utilities: "#4FC3F7",
  Health: "#81C784",
  Travel: "#EC4899",
  Home: "#F59E0B",
  "Personal Care": "#6366F1",
  Services: "#10B981",
  Government: "#6B7280",
  Income: "#10B981",
  Transfer: "#3B82F6",
  Loan: "#F43F5E",
  Fees: "#EF4444",
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [amountFilter, setAmountFilter] = useState<{
    type: "exact" | "between" | "gt" | "lt" | "any";
    value: string;
    toValue: string;
  }>({ type: "any", value: "", toValue: "" });
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getPublicUserId = useCallback(async (authId: string) => {
    console.log("Fetching public user ID for authId:", authId);
    const { data, error } = await supabase.from("users").select("id").eq("user_id", authId).single();
    if (error) {
      console.error("Error fetching public user ID:", error);
    }
    return data?.id || null;
  }, [supabase]);

  const fetchTx = useCallback(async (pubId: string, off = 0, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    console.log("Fetching transactions for user:", pubId, "offset:", off, "filters:", { search, selectedCategories, selectedAccounts, dateFilter, amountFilter });
    
    let query = supabase
      .from("plaid_transactions")
      .select("id, merchant_name, name, amount, date, category, category_icon, pending, currency_code, account_id")
      .eq("user_id", pubId);

    // 1. Search (Search only works on the loaded data for now, but better than nothing)
    // Actually search is usually best done on server
    if (search) {
      query = query.or(`name.ilike.%${search}%,merchant_name.ilike.%${search}%`);
    }

    console.log("Current pubId:", pubId, "Filters applied - Categories:", selectedCategories, "Accounts:", selectedAccounts);

    if (search || amountFilter.type !== "any") {
      const orConditions = [];

      if (search) {
        orConditions.push(`and(name.ilike.%${search}%,merchant_name.ilike.%${search}%)`);
      }

      if (amountFilter.type !== "any") {
        const val = parseFloat(amountFilter.value);
        if (!isNaN(val)) {
          if (amountFilter.type === "exact") {
            orConditions.push(`and(amount.eq.${val},amount.eq.${-val})`);
          } else if (amountFilter.type === "gt") {
            orConditions.push(`and(amount.gt.${val},amount.lt.${-val})`);
          } else if (amountFilter.type === "lt") {
            orConditions.push(`and(amount.lt.${val},amount.gt.${-val})`);
          } else if (amountFilter.type === "between") {
            const toVal = parseFloat(amountFilter.toValue);
            if (!isNaN(toVal)) {
              orConditions.push(`and(amount.gte.${val},amount.lte.${toVal}),and(amount.lte.${-val},amount.gte.${-toVal})`);
            }
          }
        }
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(","));
      }
    }

    // 3. Accounts
    if (selectedAccounts.length > 0) {
      query = query.in("account_id", selectedAccounts);
    }

    // 4. Dates
    if (dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "7d") {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        query = query.gte("date", d.toISOString().split("T")[0]);
      } else if (dateFilter === "30d") {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        query = query.gte("date", d.toISOString().split("T")[0]);
      } else if (dateFilter === "90d") {
        const d = new Date();
        d.setDate(now.getDate() - 90);
        query = query.gte("date", d.toISOString().split("T")[0]);
      } else if (dateFilter === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte("date", startOfMonth.toISOString().split("T")[0]);
      } else if (dateFilter === "last_month") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        query = query.gte("date", startOfLastMonth.toISOString().split("T")[0])
                     .lte("date", endOfLastMonth.toISOString().split("T")[0]);
      }
    }

    const { data, error } = await query
      .order("date", { ascending: false })
      .range(off, off + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching transactions:", error);
    }
    console.log("Fetched data:", data?.length, "records");

    if (data) {
      console.log("Setting transactions state with", data.length, "items. Data sample:", data.slice(0, 2));
      if (append) setTransactions((prev) => [...prev, ...data]);
      else setTransactions(data);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(off + data.length);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [supabase, search, selectedCategories, selectedAccounts, dateFilter, amountFilter]);

  const fetchAccounts = useCallback(async (pubId: string) => {
    const { data } = await supabase
      .from("plaid_accounts")
      .select("id, name")
      .eq("user_id", pubId);
    if (data) setAccounts(data);
  }, [supabase]);

  // 1. Get user on mount
  useEffect(() => {
    console.log("TransactionsPage mounted, fetching user...");
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (authError) {
        console.error("Auth error getting user:", authError);
        setLoading(false);
        return;
      }
      console.log("Auth user:", user?.id, "email:", user?.email);
      if (user) {
        getPublicUserId(user.id).then((pubId) => {
          console.log("Public userId result:", pubId);
          if (pubId) {
            setUserId(pubId);
            fetchAccounts(pubId);
          } else {
            console.error("Could not find public userId for auth user:", user.id);
            setLoading(false);
          }
        });
      } else {
        console.log("No auth user found");
        setLoading(false);
      }
    });
  }, [supabase, getPublicUserId, fetchAccounts]);

  // Re-fetch when filters change
  useEffect(() => {
    if (userId) {
      console.log("userId changed or filters changed, triggering fetchTx. userId:", userId);
      // Small delay to prevent too many requests when typing in amount/search
      const t = setTimeout(() => {
        fetchTx(userId, 0, false);
      }, 300);
      return () => clearTimeout(t);
    } else {
      console.log("userId is not set yet, cannot fetch transactions. userId type:", typeof userId);
    }
  }, [userId, search, dateFilter, selectedCategories, selectedAccounts, amountFilter, fetchTx]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) {
      console.log("Sentinel ref is null");
      return;
    }
    console.log("Setting up intersection observer");
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && userId) {
        console.log("Sentinel intersecting, fetching more...");
        fetchTx(userId, offset, true);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, offset, userId, fetchTx]);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
  };

  const filtered = transactions;

  const clearAllFilters = () => {
    setSearch("");
    setDateFilter("all");
    setSelectedCategories([]);
    setSelectedAccounts([]);
    setAmountFilter({ type: "any", value: "", toValue: "" });
  };

  const hasActiveFilters = search !== "" || dateFilter !== "all" || selectedCategories.length > 0 || selectedAccounts.length > 0 || amountFilter.type !== "any";

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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fff" }}>
                  Transactions
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-full text-md outline-none"
                        style={{
                          backgroundColor: "#181C27",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#fff",
                          fontFamily: "Space Grotesk",
                        }}
                    />
                  </div>
                </div>
                <Button className="h-10 px-4 rounded-full text-md font-medium flex items-center border-[rgba(255,255,255,0.08)] bg-[#181C27] hover:bg-[#1E2334] text-[rgba(255,255,255,0.6)] hover:text-white">
                  Sort by date
                  <ChevronDown size={14} className="ml-1 opacity-40" />
                </Button>
              </div>
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

            {/* filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap justify-between gap-3 bg-[#181C27] p-2 rounded-2xl">

                {/* Dates Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="flex-1 min-w-[120px]">
                    <Button
                      variant="outline"
                      className={`w-full px-4 rounded-2xl h-12 text-s font-medium flex items-center gap-2 border-[rgba(255,255,255,0.08)] bg-[#181C27] hover:bg-[#1E2334] text-[rgba(255,255,255,0.6)] hover:text-white ${dateFilter !== "all" ? "border-[#00D4AA] text-[#00D4AA] bg-[rgba(0,212,170,0.05)]" : ""}`}
                    >
                      <Calendar size={14} />
                      {dateFilter === "all" ? "Dates" : 
                       dateFilter === "7d" ? "Last 7 days" :
                       dateFilter === "30d" ? "Last 30 days" :
                       dateFilter === "90d" ? "Last 90 days" :
                       dateFilter === "this_month" ? "This month" : "Last month"}
                      <ChevronDown size={14} className="ml-1 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-65 bg-[#181C27] border-[rgba(255,255,255,0.1)] text-[#fff] rounded-2xl">
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("all")}>All Time</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("7d")}>Last 7 days</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("30d")}>Last 30 days</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("90d")}>Last 90 days</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.05)]" />
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("this_month")}>This month</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" onClick={() => setDateFilter("last_month")}>Last month</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Categories Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="flex-1 min-w-[120px]">
                    <Button
                      variant="outline"
                      className={`w-full px-4 rounded-2xl h-12 text-s font-medium flex items-center gap-2 border-[rgba(255,255,255,0.08)] bg-[#181C27] hover:bg-[#1E2334] text-[rgba(255,255,255,0.6)] hover:text-white ${selectedCategories.length > 0 ? "border-[#00D4AA] text-[#00D4AA] bg-[rgba(0,212,170,0.05)]" : ""}`}
                    >
                      <CheckCircle2 size={14} />
                      {selectedCategories.length === 0 ? "Categories" : 
                       selectedCategories.length === 1 ? selectedCategories[0] : 
                       `${selectedCategories.length} Categories`}
                      <ChevronDown size={14} className="ml-1 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-65 bg-[#181C27] border-[rgba(255,255,255,0.1)] text-[#fff] max-h-80 overflow-y-auto scrollbar-hide rounded-2xl">
                    {CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedCategories([...selectedCategories, cat]);
                          else setSelectedCategories(selectedCategories.filter(c => c !== cat));
                        }}
                        onSelect={(e) => e.preventDefault()}
                        className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]"
                      >
                        {cat}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Accounts Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="flex-1 min-w-[120px]">
                    <Button
                      variant="outline"
                      className={`w-full px-4 rounded-2xl h-12 text-s font-medium flex items-center gap-2 border-[rgba(255,255,255,0.08)] bg-[#181C27] hover:bg-[#1E2334] text-[rgba(255,255,255,0.6)] hover:text-white ${selectedAccounts.length > 0 ? "border-[#00D4AA] text-[#00D4AA] bg-[rgba(0,212,170,0.05)]" : ""}`}
                    >
                      <CreditCard size={14} />
                      {selectedAccounts.length === 0 ? "Accounts" : 
                       selectedAccounts.length === 1 ? (accounts.find(a => a.id === selectedAccounts[0])?.name || "1 Account") : 
                       `${selectedAccounts.length} Accounts`}
                      <ChevronDown size={14} className="ml-1 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-65 bg-[#181C27] border-[rgba(255,255,255,0.1)] text-[#fff] rounded-2xl">
                    {accounts.length === 0 ? (
                      <div className="p-2 text-center text-xs text-[rgba(255,255,255,0.3)]">No accounts found</div>
                    ) : (
                      accounts.map((acc) => (
                        <DropdownMenuCheckboxItem
                          key={acc.id}
                          checked={selectedAccounts.includes(acc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAccounts([...selectedAccounts, acc.id]);
                            else setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id));
                          }}
                          onSelect={(e) => e.preventDefault()}
                          className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]"
                        >
                          {acc.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Amounts Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="flex-1 min-w-[120px]">
                    <Button
                      variant="outline"
                      className={`w-full px-4 rounded-2xl h-12 text-s font-medium flex items-center gap-2 border-[rgba(255,255,255,0.08)] bg-[#181C27] hover:bg-[#1E2334] text-[rgba(255,255,255,0.6)] hover:text-white ${amountFilter.type !== "any" ? "border-[#00D4AA] text-[#00D4AA] bg-[rgba(0,212,170,0.05)]" : ""}`}
                    >
                      <DollarSign size={14} />
                      {amountFilter.type === "any" ? "Amounts" : 
                       amountFilter.type === "exact" ? `$${amountFilter.value}` :
                       amountFilter.type === "gt" ? `> $${amountFilter.value}` :
                       amountFilter.type === "lt" ? `< $${amountFilter.value}` :
                       `$${amountFilter.value} - $${amountFilter.toValue}`}
                      <ChevronDown size={14} className="ml-1 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-65 bg-[#181C27] border-[rgba(255,255,255,0.1)] p-4 text-[#fff] rounded-2xl"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Condition</label>
                        <Select
                          value={amountFilter.type}
                          onValueChange={(v: any) => setAmountFilter({ ...amountFilter, type: v })}
                        >
                          <SelectTrigger className="h-9 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-xs">
                            <SelectValue placeholder="Any amount" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#181C27] border-[rgba(255,255,255,0.1)] text-[#fff] rounded-2xl">
                            <SelectItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" value="any">Any amount</SelectItem>
                            <SelectItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" value="exact">Exact amount</SelectItem>
                            <SelectItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" value="gt">Greater than</SelectItem>
                            <SelectItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" value="lt">Less than</SelectItem>
                            <SelectItem className="rounded-2xl focus:bg-[rgba(0,212,170,0.1)] focus:text-[#00D4AA]" value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {amountFilter.type !== "any" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
                            {amountFilter.type === "between" ? "From Amount" : "Amount"}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] text-xs">$</span>
                            <Input
                              type="number"
                              value={amountFilter.value}
                              onChange={(e) => setAmountFilter({ ...amountFilter, value: e.target.value })}
                              className="h-9 pl-7 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-xs focus-visible:ring-[#00D4AA]"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}

                      {amountFilter.type === "between" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">To Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] text-xs">$</span>
                            <Input
                              type="number"
                              value={amountFilter.toValue}
                              onChange={(e) => setAmountFilter({ ...amountFilter, toValue: e.target.value })}
                              className="h-9 pl-7 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-xs focus-visible:ring-[#00D4AA]"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}

                      {amountFilter.type !== "any" && (
                        <Button 
                          variant="ghost" 
                          onClick={() => setAmountFilter({ type: "any", value: "", toValue: "" })}
                          className="w-full h-8 text-[10px] text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B10]"
                        >
                          Reset Amount
                        </Button>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="h-12 text-s rounded-full font-medium text-black bg-white hover:bg-[#00D4AA] flex-1 sm:flex-initial"
                    >
                      Clear filters
                    </Button>
                )}
              </div>
            </div>

            {/* Transaction table */}
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
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-md" style={{ color: "#00D4AA" }}>
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
                          {tx.category_icon ? (
                            <img src={tx.category_icon} alt={tx.category} className="w-5 h-5 object-contain" />
                          ) : (
                            (tx.merchant_name || tx.name).slice(0, 1).toUpperCase()
                          )}
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
