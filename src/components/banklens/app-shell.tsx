"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/banklens/sidebar";

interface AppShellProps {
  children: ReactNode;
  userEmail?: string;
  isConnected?: boolean;
  onDisconnect?: () => void;
}

export default function AppShell({ children, userEmail, isConnected, onDisconnect }: AppShellProps) {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "#0F1117", fontFamily: "Space Grotesk, sans-serif" }}
    >
      <Sidebar
        userEmail={userEmail}
        isConnected={isConnected}
        onDisconnect={onDisconnect}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
