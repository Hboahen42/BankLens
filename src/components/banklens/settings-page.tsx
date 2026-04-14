"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import AppShell from "@/components/banklens/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  User,
  Bell,
  Shield,
  Palette,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";

interface SettingsPageProps {
  userEmail: string;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const SECTIONS: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: User, color: "#00D4AA" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "#7B61FF" },
  { id: "privacy", label: "Privacy & Security", icon: Shield, color: "#FFB347" },
  { id: "appearance", label: "Appearance", icon: Palette, color: "#FF6B6B" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-200"
      style={{ backgroundColor: checked ? "#00D4AA" : "rgba(255,255,255,0.12)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          backgroundColor: "#fff",
          left: checked ? "calc(100% - 22px)" : "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function SectionCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{title}</h2>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{description}</p>}
      </div>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({ userEmail }: SettingsPageProps) {
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState("profile");
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState({
    weeklyReport: true,
    largeTransactions: true,
    newSubscriptions: false,
    lowBalance: true,
  });
  const [privacy, setPrivacy] = useState({
    twoFactor: false,
    sessionTimeout: true,
    analyticsOptOut: false,
  });
  const [theme, setTheme] = useState<"dark" | "system" | "light">("dark");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    setDisplayName(userEmail?.split("@")[0] || "");
  }, [userEmail]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingProfile(false);
    toast.success("Profile updated");
  };

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/dashboard/reset-password`,
    });
    if (error) toast.error("Failed to send reset email");
    else toast.success("Password reset email sent");
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "BL";

  return (
    <>
      <div className="banklens-bg min-h-screen" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        <AppShell userEmail={userEmail}>
          <div className="p-8 max-w-[1100px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#fff" }}>
                Settings
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Manage your account and preferences
              </p>
            </div>

            <div className="flex gap-6">
              {/* Sidebar nav */}
              <div
                className="w-56 shrink-0 rounded-2xl p-3 h-fit"
                style={{ backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {SECTIONS.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1"
                    style={{
                      backgroundColor: activeSection === id ? `${color}12` : "transparent",
                      color: activeSection === id ? color : "rgba(255,255,255,0.5)",
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <Icon size={16} />
                    {label}
                    {activeSection === id && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-5">
                {/* Profile */}
                {activeSection === "profile" && (
                  <>
                    <SectionCard title="Account Details">
                      <div className="px-6 py-6 flex items-center gap-5">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                          style={{ backgroundColor: "rgba(0,212,170,0.2)", color: "#00D4AA", fontFamily: "Syne" }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-base font-semibold" style={{ color: "#fff" }}>{displayName}</p>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{userEmail}</p>
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Display Name
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff",
                              fontFamily: "Space Grotesk",
                            }}
                          />
                          <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{ backgroundColor: "#00D4AA", color: "#0F1117" }}
                          >
                            {savingProfile ? (
                              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(15,17,23,0.3)", borderTopColor: "#0F1117" }} />
                            ) : (
                              <Check size={14} />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Security">
                      <SettingRow label="Email Address" description={userEmail}>
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(0,212,170,0.1)", color: "#00D4AA" }}>Verified</span>
                      </SettingRow>
                      <SettingRow label="Password" description="Last changed recently">
                        <button
                          onClick={handleChangePassword}
                          className="text-sm px-4 py-2 rounded-xl transition-all"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"}
                        >
                          Change password
                        </button>
                      </SettingRow>
                    </SectionCard>

                    <SectionCard title="Preferred Currency">
                      <SettingRow label="Currency" description="Used for display across the app">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontFamily: "Space Grotesk" }}
                        >
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="CAD">CAD — Canadian Dollar</option>
                        </select>
                      </SettingRow>
                    </SectionCard>
                  </>
                )}

                {/* Notifications */}
                {activeSection === "notifications" && (
                  <SectionCard title="Notification Preferences">
                    <SettingRow label="Weekly spending report" description="Get a summary every Monday morning">
                      <Toggle checked={notifications.weeklyReport} onChange={(v) => setNotifications((p) => ({ ...p, weeklyReport: v }))} />
                    </SettingRow>
                    <SettingRow label="Large transactions" description="Alert when a transaction exceeds $100">
                      <Toggle checked={notifications.largeTransactions} onChange={(v) => setNotifications((p) => ({ ...p, largeTransactions: v }))} />
                    </SettingRow>
                    <SettingRow label="New subscriptions detected" description="When a new recurring charge is found">
                      <Toggle checked={notifications.newSubscriptions} onChange={(v) => setNotifications((p) => ({ ...p, newSubscriptions: v }))} />
                    </SettingRow>
                    <SettingRow label="Low balance alerts" description="When any account drops below $200">
                      <Toggle checked={notifications.lowBalance} onChange={(v) => setNotifications((p) => ({ ...p, lowBalance: v }))} />
                    </SettingRow>
                  </SectionCard>
                )}

                {/* Privacy & Security */}
                {activeSection === "privacy" && (
                  <>
                    <SectionCard title="Security Options">
                      <SettingRow label="Two-factor authentication" description="Add an extra layer of security">
                        <Toggle checked={privacy.twoFactor} onChange={(v) => setPrivacy((p) => ({ ...p, twoFactor: v }))} />
                      </SettingRow>
                      <SettingRow label="Auto session timeout" description="Log out after 30 minutes of inactivity">
                        <Toggle checked={privacy.sessionTimeout} onChange={(v) => setPrivacy((p) => ({ ...p, sessionTimeout: v }))} />
                      </SettingRow>
                    </SectionCard>

                    <SectionCard title="Data & Privacy">
                      <SettingRow label="Opt out of analytics" description="Disable anonymous usage data collection">
                        <Toggle checked={privacy.analyticsOptOut} onChange={(v) => setPrivacy((p) => ({ ...p, analyticsOptOut: v }))} />
                      </SettingRow>
                      <SettingRow label="Connected institutions" description="Manage your Plaid bank connections">
                        <button
                          className="text-sm px-4 py-2 rounded-xl"
                          style={{ backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}
                        >
                          Manage
                        </button>
                      </SettingRow>
                      <SettingRow label="Delete all data" description="Permanently remove your account and data">
                        <button
                          className="text-sm px-4 py-2 rounded-xl"
                          style={{ backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}
                        >
                          Delete account
                        </button>
                      </SettingRow>
                    </SectionCard>
                  </>
                )}

                {/* Appearance */}
                {activeSection === "appearance" && (
                  <SectionCard title="Theme">
                    <div className="px-6 py-5 grid grid-cols-3 gap-3">
                      {([
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Smartphone },
                        { id: "light", label: "Light", icon: Sun },
                      ] as const).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setTheme(id)}
                          className="flex flex-col items-center gap-3 p-4 rounded-xl transition-all"
                          style={{
                            backgroundColor: theme === id ? "rgba(0,212,170,0.1)" : "rgba(255,255,255,0.04)",
                            border: theme === id ? "1px solid rgba(0,212,170,0.3)" : "1px solid rgba(255,255,255,0.07)",
                            color: theme === id ? "#00D4AA" : "rgba(255,255,255,0.5)",
                          }}
                        >
                          <Icon size={20} />
                          <span className="text-sm font-medium">{label}</span>
                          {theme === id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00D4AA" }} />}
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>
        </AppShell>
      </div>
      <Toaster toastOptions={{ style: { backgroundColor: "#181C27", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" } }} />
    </>
  );
}
