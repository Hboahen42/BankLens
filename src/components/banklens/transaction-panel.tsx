"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

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
}

interface TransactionPanelProps {
  transactions: Transaction[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

const CATEGORIES = ["All", "Food & Drink", "Transport", "Shopping", "Groceries", "Entertainment", "Health", "Utilities", "Income", "Other"];

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Drink": "🍔",
  Transport: "🚗",
  Shopping: "🛍️",
  Groceries: "🛒",
  Entertainment: "🎬",
  Health: "💊",
  Utilities: "⚡",
  Income: "💵",
  Other: "💳",
};

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TransactionRowSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer w-9 h-9 rounded-xl" />
        <div>
          <div className="skeleton-shimmer w-32 h-4 rounded mb-2" />
          <div className="skeleton-shimmer w-20 h-3 rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="skeleton-shimmer w-20 h-4 rounded mb-2 ml-auto" />
        <div className="skeleton-shimmer w-12 h-3 rounded ml-auto" />
      </div>
    </div>
  );
}

function TransactionRow({
  tx,
  index,
}: {
  tx: Transaction;
  index: number;
}) {
  const isCredit = tx.amount < 0;
  const categoryIcon = tx.category_icon ? (
    <img src={tx.category_icon} alt={tx.category} className="w-6 h-6 object-contain" />
  ) : (
    CATEGORY_ICONS[tx.category] || "💳"
  );
  const displayName = tx.merchant_name || tx.name;

  return (
    <div
      className="tx-row flex items-center justify-between px-5 py-4 cascade-in rounded-lg mx-1"
      style={{
        animationDelay: `${Math.min(index * 25, 300)}ms`,
        cursor: "default",
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Category icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          {categoryIcon}
        </div>

        {/* Name + category */}
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: "rgba(255,255,255,0.9)",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {tx.category}
            </span>
            {tx.pending && (
              <span
                className="text-xs"
                style={{ color: "rgba(255,189,68,0.7)", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Amount + date */}
      <div className="text-right shrink-0 ml-4">
        <p
          className="text-sm font-semibold"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: isCredit ? "#00D4AA" : "#FF6B6B",
          }}
        >
          {isCredit ? "+" : "-"}
          {formatCurrency(tx.amount, tx.currency_code)}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "rgba(255,255,255,0.3)",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {formatDate(tx.date)}
        </p>
      </div>
    </div>
  );
}

export default function TransactionPanel({
  transactions,
  loading = false,
  hasMore = false,
  onLoadMore,
}: TransactionPanelProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          await onLoadMore();
          setLoadingMore(false);
        }
      },
      { threshold: 0.1 }
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      !debouncedSearch ||
      (tx.merchant_name || tx.name)
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || tx.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <h2
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: "Syne, sans-serif",
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "-0.01em",
        }}
      >
        Transactions
      </h2>

      {/* Search + Filter bar */}
      <div
        className="rounded-2xl p-4 mb-1"
        style={{
          backgroundColor: "#181C27",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Search input */}
        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          />
          <input
            type="text"
            placeholder="Search merchants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Space Grotesk, sans-serif",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(0,212,170,0.4)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(255,255,255,0.08)";
            }}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`filter-chip text-xs px-3 py-1.5 rounded-full transition-all flex-1 min-w-[70px] ${activeCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#181C27",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <TransactionRowSkeleton key={i} index={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="text-4xl"
              style={{ filter: "grayscale(1) opacity(0.4)" }}
            >
              📭
            </div>
            <p
              className="text-sm"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {debouncedSearch || activeCategory !== "All"
                ? "No transactions match your filter"
                : "No transactions yet"}
            </p>
          </div>
        ) : (
          <>
            {filtered.map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} index={i} />
            ))}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div
                ref={bottomRef}
                className="flex items-center justify-center py-4"
              >
                {loadingMore && (
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    style={{ color: "rgba(0,212,170,0.5)" }}
                  />
                )}
              </div>
            )}

            {!hasMore && filtered.length > 0 && (
              <div className="flex items-center justify-center py-4 gap-2">
                <div
                  className="h-px w-16"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                >
                  All transactions loaded
                </span>
                <div
                  className="h-px w-16"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
