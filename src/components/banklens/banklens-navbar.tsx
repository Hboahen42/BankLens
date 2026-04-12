"use client";

import { useState } from "react";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Unlink } from "lucide-react";
import { toast } from "sonner";
import {signOutAction} from "@/app/actions";

interface BankLensNavbarProps {
  userEmail?: string;
  isConnected: boolean;
  onDisconnect: () => void;
}

export default function BankLensNavbar({
  userEmail,
  isConnected,
  onDisconnect,
}: BankLensNavbarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "BL";

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/plaid-disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Disconnect failed");
      onDisconnect();
      toast.success("Bank disconnected successfully");
    } catch {
      toast.error("Failed to disconnect bank");
    } finally {
      setDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  return (
    <>
      <nav
        className="w-full border-b sticky top-0 z-50"
        style={{
          backgroundColor: "#0F1117",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#00D4AA" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#0F1117", fontFamily: "Syne, sans-serif" }}
              >
                BL
              </span>
            </div>
            <span
              className="text-xl font-extrabold tracking-tight"
              style={{
                fontFamily: "Syne, sans-serif",
                color: "#ffffff",
              }}
            >
              BankLens
            </span>
          </div>

          {/* Right side */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(0,212,170,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    backgroundColor: "rgba(0,212,170,0.2)",
                    color: "#00D4AA",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                >
                  {initials}
                </div>
                <span
                  className="text-sm hidden sm:block"
                  style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {userEmail?.split("@")[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{
                backgroundColor: "#181C27",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
              }}
            >
              <div className="px-3 py-2">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk, sans-serif" }}>
                  Signed in as
                </p>
                <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Space Grotesk, sans-serif" }}>
                  {userEmail}
                </p>
              </div>
              <DropdownMenuSeparator style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
              {isConnected && (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/5"
                    style={{ color: "#FF6B6B", fontFamily: "Space Grotesk, sans-serif" }}
                    onClick={() => setShowDisconnectModal(true)}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect Bank
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                </>
              )}
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/5"
                style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk, sans-serif" }}
                onClick={() => signOutAction()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Disconnect Confirmation Modal */}
      <AlertDialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
        <AlertDialogContent
          style={{
            backgroundColor: "#181C27",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontFamily: "Syne, sans-serif", color: "#ffffff" }}
            >
              Disconnect Bank?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Space Grotesk, sans-serif" }}
            >
              This will remove all your connected accounts and transaction history.
              You can reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={disconnecting}
              onClick={handleDisconnect}
              style={{
                backgroundColor: "#FF6B6B",
                color: "#fff",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
