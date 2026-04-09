"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

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

interface BalanceCardsProps {
  accounts: Account[];
  onRefresh: () => Promise<void>;
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function AccountTypeTag({ type, subtype }: { type: string; subtype: string }) {
  const label = subtype
    ? subtype.charAt(0).toUpperCase() + subtype.slice(1)
    : type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        backgroundColor: "rgba(0,212,170,0.12)",
        color: "#00D4AA",
        fontFamily: "Space Grotesk, sans-serif",
        border: "1px solid rgba(0,212,170,0.2)",
      }}
    >
      {label}
    </span>
  );
}

function InstitutionBadge({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{
        backgroundColor: color + "22",
        border: `1px solid ${color}44`,
        color: color,
        fontFamily: "Syne, sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "#181C27",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
        <div className="skeleton-shimmer w-16 h-5 rounded-full" />
      </div>
      <div className="skeleton-shimmer w-32 h-4 rounded mb-4" />
      <div className="skeleton-shimmer w-48 h-9 rounded mb-3" />
      <div className="skeleton-shimmer w-24 h-3 rounded" />
    </div>
  );
}

function BalanceCard({
  account,
  index,
  onRefresh,
}: {
  account: Account;
  index: number;
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const institutionName =
    account.connection?.institution_name || "Unknown Bank";
  const institutionColor = account.connection?.institution_color || "#00D4AA";

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div
      className="rounded-2xl p-6 fade-slide-up"
      style={{
        backgroundColor: "#181C27",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <InstitutionBadge name={institutionName} color={institutionColor} />
          <div>
            <p
              className="text-sm font-medium"
              style={{
                color: "rgba(255,255,255,0.9)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {institutionName}
            </p>
            <AccountTypeTag type={account.type} subtype={account.subtype} />
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg transition-all"
          style={{
            color: "rgba(255,255,255,0.3)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#00D4AA";
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "rgba(0,212,170,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(255,255,255,0.3)";
            (e.currentTarget as HTMLElement).style.backgroundColor =
              "rgba(255,255,255,0.04)";
          }}
          title="Refresh balance"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <p
        className="text-sm mb-1.5"
        style={{
          color: "rgba(255,255,255,0.4)",
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        {account.name}
      </p>

      <p
        className="text-3xl font-bold mb-3"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}
      >
        {formatCurrency(account.current_balance, account.currency_code)}
      </p>

      {account.available_balance !== undefined &&
        account.available_balance !== account.current_balance && (
          <p
            className="text-xs"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Available:{" "}
            <span style={{ color: "rgba(255,255,255,0.5)" }}>
              {formatCurrency(account.available_balance, account.currency_code)}
            </span>
          </p>
        )}
    </div>
  );
}

export default function BalanceCards({
  accounts,
  onRefresh,
}: BalanceCardsProps) {
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
        Accounts
      </h2>
      {accounts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BalanceCardSkeleton />
          <BalanceCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, index) => (
            <BalanceCard
              key={account.id}
              account={account}
              index={index}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
