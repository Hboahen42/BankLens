"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Unlink,
} from "lucide-react";
import { signOutAction } from "@/app/actions";

interface SidebarProps {
  userEmail?: string;
  isConnected?: boolean;
  onDisconnect?: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: RefreshCcw,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar({ userEmail, isConnected, onDisconnect }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "BL";

  return (
    <aside
      className="flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 shrink-0"
      style={{
        width: collapsed ? "72px" : "240px",
        backgroundColor: "#0D1019",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#00D4AA" }}
        >
          <span className="text-xs font-bold" style={{ color: "#0F1117", fontFamily: "Syne, sans-serif" }}>
            BL
          </span>
        </div>
        {!collapsed && (
          <span
            className="text-lg font-extrabold tracking-tight whitespace-nowrap overflow-hidden"
            style={{ fontFamily: "Syne, sans-serif", color: "#ffffff" }}
          >
            BankLens
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-hidden">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                backgroundColor: active ? "rgba(0,212,170,0.12)" : "transparent",
                color: active ? "#00D4AA" : "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <Icon
                className="shrink-0"
                size={18}
                style={{ color: active ? "#00D4AA" : "rgba(255,255,255,0.4)" }}
              />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
              {active && !collapsed && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#00D4AA" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="border-t p-3 flex flex-col gap-2"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* User info */}
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: "rgba(0,212,170,0.2)", color: "#00D4AA" }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                {userEmail?.split("@")[0]}
              </p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {userEmail}
              </p>
            </div>
          )}
        </div>

        {/* Disconnect */}
        {isConnected && (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full"
            style={{ color: "rgba(255,107,107,0.7)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,107,107,0.08)";
              (e.currentTarget as HTMLElement).style.color = "#FF6B6B";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,107,107,0.7)";
            }}
          >
            <Unlink size={16} className="shrink-0" />
            {!collapsed && <span className="text-sm">Disconnect Bank</span>}
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOutAction()}
          className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
          }}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-xl transition-all duration-200"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)";
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
