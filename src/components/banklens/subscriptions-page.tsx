"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import AppShell from "@/components/banklens/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { RefreshCw, Calendar, Zap, TrendingDown } from "lucide-react";
import { addDays, addMonths, addWeeks, format, isAfter, isBefore, startOfDay } from "date-fns";

interface Transaction {
  id: string;
  merchant_name?: string;
  name: string;
  amount: number;
  date: string;
  category: string;
}

interface Subscription {
  name: string;
  amount: number;
  lastDate: string;
  nextDate: string;
  frequency: "weekly" | "monthly" | "annual";
  category: string;
  count: number;
}

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const FREQ_LABEL = { weekly: "Weekly", monthly: "Monthly", annual: "Annual" };
const FREQ_COLORS = { weekly: "#7B61FF", monthly: "#00D4AA", annual: "#FFB347" };

// Detect subscriptions: transactions with same merchant appearing 2+ times
function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const merchantMap: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (t.amount <= 0) return; // skip credits
    const key = (t.merchant_name || t.name).toLowerCase().trim();
    if (!merchantMap[key]) merchantMap[key] = [];
    merchantMap[key].push(t);
  });

  const subs: Subscription[] = [];

  Object.entries(merchantMap).forEach(([, txs]) => {
    if (txs.length < 2) return;
    // Sort by date
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + Math.abs(a - avgAmount), 0) / amounts.length;
    if (variance / avgAmount > 0.3) return; // skip if amount varies too much

    // Detect frequency
    const dates = sorted.map((t) => new Date(t.date));
    let totalDiff = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDiff += (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    }
    const avgDiff = totalDiff / (dates.length - 1);

    let frequency: "weekly" | "monthly" | "annual" = "monthly";
    if (avgDiff < 10) frequency = "weekly";
    else if (avgDiff > 300) frequency = "annual";

    const lastDate = sorted[sorted.length - 1].date;
    let nextDate: Date;
    if (frequency === "weekly") nextDate = addWeeks(new Date(lastDate), 1);
    else if (frequency === "monthly") nextDate = addMonths(new Date(lastDate), 1);
    else nextDate = addMonths(new Date(lastDate), 12);

    subs.push({
      name: sorted[0].merchant_name || sorted[0].name,
      amount: avgAmount,
      lastDate,
      nextDate: nextDate.toISOString().split("T")[0],
      frequency,
      category: sorted[0].category || "Other",
      count: sorted.length,
    });
  });

  return subs.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

function UpcomingCalendar({ subscriptions }: { subscriptions: Subscription[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const byDate: Record<string, Subscription[]> = {};
  subscriptions.forEach((s) => {
    const k = s.nextDate;
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(s);
  });

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
        Upcoming — Next 30 Days
      </h2>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs py-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            {d}
          </div>
        ))}
        {/* Empty cells for first week */}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const hasSub = byDate[dateKey] && byDate[dateKey].length > 0;
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          return (
            <div
              key={dateKey}
              className="relative flex flex-col items-center rounded-lg py-1.5"
              style={{
                backgroundColor: isToday ? "rgba(0,212,170,0.1)" : hasSub ? "rgba(255,107,107,0.08)" : "transparent",
                border: isToday ? "1px solid rgba(0,212,170,0.3)" : "1px solid transparent",
              }}
              title={hasSub ? byDate[dateKey].map((s) => s.name).join(", ") : ""}
            >
              <span className="text-xs" style={{ color: isToday ? "#00D4AA" : "rgba(255,255,255,0.55)" }}>
                {format(day, "d")}
              </span>
              {hasSub && (
                <div className="flex gap-0.5 mt-0.5">
                  {byDate[dateKey].slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: "#FF6B6B" }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SubscriptionsPageProps {
  userEmail?: string;
}

export default function SubscriptionsPage({ userEmail }: SubscriptionsPageProps) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

            const { data: pubUser } = await supabase.from("users").select("id").eq("user_id", user.id).single();
        if (!pubUser) return;

            const { data } = await supabase
          .from("plaid_transactions")
          .select("id, merchant_name, name, amount, date, category")
          .eq("user_id", pubUser.id)
          .order("date", { ascending: false })
          .limit(500);

            if (!cancelled && data) setTransactions(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
    cancelled = true;
    };
  }, [supabase]);

  const subscriptions = detectSubscriptions(transactions);
  const monthlyTotal = subscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount, 0);
  const annualTotal = subscriptions.reduce((sum, s) => {
    if (s.frequency === "monthly") return sum + s.amount * 12;
    if (s.frequency === "weekly") return sum + s.amount * 52;
    return sum + s.amount;
  }, 0);

  const upcomingThisWeek = subscriptions.filter((s) => {
    const next = new Date(s.nextDate);
    const now = new Date();
    return isAfter(next, now) && isBefore(next, addDays(now, 7));
  });

  return (
    <>
      <div className="banklens-bg min-h-screen" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        <AppShell userEmail={userEmail}>
          <div className="p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fff" }}>
                Subscriptions
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Recurring charges detected from your transactions
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,212,170,0.2)", borderTopColor: "#00D4AA" }} />
              </div>
            ) : (
              <>
                {/* Stat row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,212,170,0.15)" }}>
                      <RefreshCw size={16} style={{ color: "#00D4AA" }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Monthly Cost</p>
                      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: "JetBrains Mono", color: "#fff" }}>{fmt.format(monthlyTotal)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,107,107,0.12)" }}>
                      <TrendingDown size={16} style={{ color: "#FF6B6B" }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Annual Cost</p>
                      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: "JetBrains Mono", color: "#fff" }}>{fmt.format(annualTotal)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(123,97,255,0.15)" }}>
                      <Zap size={16} style={{ color: "#7B61FF" }} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Active Subscriptions</p>
                      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: "JetBrains Mono", color: "#fff" }}>{subscriptions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                  {/* Calendar */}
                  <div className="lg:col-span-3">
                    <UpcomingCalendar subscriptions={subscriptions} />
                  </div>

                  {/* Due this week */}
                  <div className="lg:col-span-2 rounded-2xl p-6" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Due This Week
                    </h2>
                    {upcomingThisWeek.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <Calendar size={24} style={{ color: "rgba(255,255,255,0.15)" }} />
                        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>Nothing due this week</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {upcomingThisWeek.map((s) => (
                          <div key={s.name} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)" }}>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "#fff" }}>{s.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {new Date(s.nextDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <span className="text-sm font-semibold" style={{ fontFamily: "JetBrains Mono", color: "#FF6B6B" }}>
                              −{fmt.format(s.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscriptions list */}
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div
                    className="grid grid-cols-[1fr_120px_120px_120px_100px] px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span>Service</span>
                    <span>Frequency</span>
                    <span>Last charge</span>
                    <span>Next charge</span>
                    <span className="text-right">Amount</span>
                  </div>

                  {subscriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <RefreshCw size={28} style={{ color: "rgba(255,255,255,0.1)" }} />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No recurring charges detected</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Connect your bank to start tracking subscriptions</p>
                    </div>
                  ) : (
                    subscriptions.map((s, i) => {
                      const freqColor = FREQ_COLORS[s.frequency];
                      const isPast = isBefore(new Date(s.nextDate), new Date());
                      return (
                        <div
                          key={s.name}
                          className="grid grid-cols-[1fr_120px_120px_120px_100px] px-5 py-4 transition-all"
                          style={{ borderBottom: i < subscriptions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: `${freqColor}18`, color: freqColor, fontFamily: "Syne" }}
                            >
                              {s.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "#fff" }}>{s.name}</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{s.count} charges detected</p>
                            </div>
                          </div>
                          <div className="my-auto">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${freqColor}18`, color: freqColor }}>
                              {FREQ_LABEL[s.frequency]}
                            </span>
                          </div>
                          <span className="text-sm my-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {new Date(s.lastDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span
                            className="text-sm my-auto font-medium"
                            style={{ color: isPast ? "#FF6B6B" : "rgba(255,255,255,0.6)" }}
                          >
                            {new Date(s.nextDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span className="text-sm font-semibold text-right my-auto" style={{ fontFamily: "JetBrains Mono", color: "#FF6B6B" }}>
                            −{fmt.format(s.amount)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </AppShell>
      </div>
      <Toaster toastOptions={{ style: { backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" } }} />
    </>
  );
}
