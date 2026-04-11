"use client";

import { useState } from "react";
import { createClient } from "../../../supabase/client";
import { ShieldCheck, Eye, Zap } from "lucide-react";
import { toast } from "sonner";

interface ConnectBankHeroProps {
  onConnected: () => void;
}

export default function ConnectBankHero({ onConnected }: ConnectBankHeroProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Create link token
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/supabase-functions-plaid-create-link-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      const data = await res.json();

      if (data.mock) {
        // Mock flow: skip Plaid UI, exchange mock token directly
        const exchangeRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/supabase-functions-plaid-exchange-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ public_token: "mock-public-token" }),
          }
        );
        const exchangeData = await exchangeRes.json();
        if (exchangeData.success) {
          toast.success("Bank connected successfully!");
          onConnected();
        } else {
          throw new Error(exchangeData.error || "Exchange failed");
        }
      } else {
        // Real Plaid Link flow
        // @ts-ignore
        const { open } = window.Plaid?.create({
          token: data.link_token,
          onSuccess: async (public_token: string) => {
            const exchangeRes = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/supabase-functions-plaid-exchange-token`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ public_token }),
              }
            );
            const exchangeData = await exchangeRes.json();
            if (exchangeData.success) {
              toast.success("Bank connected successfully!");
              onConnected();
            } else {
              throw new Error(exchangeData.error);
            }
            setLoading(false);
          },
          onExit: () => {
            setLoading(false);
            toast.error("Bank connection cancelled");
          },
        });
        open();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Hero card */}
      <div
        className="w-full max-w-md rounded-2xl p-10 flex flex-col items-center gap-8 relative overflow-hidden"
        style={{
          backgroundColor: "#181C27",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Glow effect behind icon */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "#00D4AA" }}
        />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(0,212,170,0.05) 100%)",
            border: "1px solid rgba(0,212,170,0.3)",
          }}
        >
          <Zap className="h-8 w-8" style={{ color: "#00D4AA" }} />
        </div>

        {/* Headline */}
        <div className="text-center relative z-10">
          <h1
            className="text-3xl font-extrabold mb-3 tracking-tight"
            style={{ fontFamily: "Syne, sans-serif", color: "#ffffff" }}
          >
            Connect Your Bank
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Securely link your bank accounts for an instant, real-time view of your balances and transactions.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-base relative z-10 transition-all"
          style={{
            backgroundColor: loading ? "rgba(0,212,170,0.6)" : "#00D4AA",
            color: "#0F1117",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 600,
            boxShadow: loading ? "none" : "0 4px 20px rgba(0,212,170,0.25)",
          }}
          onMouseEnter={(e) => {
            if (!loading)
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Connecting…
            </span>
          ) : (
            "Connect Your Bank"
          )}
        </button>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" style={{ color: "#00D4AA" }} />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              256-bit encryption
            </span>
          </div>
          <div
            className="w-px h-4"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" style={{ color: "#00D4AA" }} />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Read-only access
            </span>
          </div>
          <div
            className="w-px h-4"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" style={{ color: "#00D4AA" }} />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Powered by Plaid
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
