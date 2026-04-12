"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, TrendingUp, PieChart, Shield, Clock, Bell } from "lucide-react";
import BackgroundImage from "@/components/landing/BackgroundImage";

/* ──────────────────────────────────────────────
   Navbar
────────────────────────────────────────────── */
function LandingNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-4">
      <span className="text-white font-inter font-bold text-2xl tracking-tight">BankLens</span>
      <div className="flex items-center gap-4">
        <Link
          href="/sign-in"
          className="text-white font-inter font-normal text-sm hover:text-gray-200 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="bg-white text-[#0d1117] font-inter font-normal text-sm px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────
   Hero Section
────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <BackgroundImage />

      <LandingNavbar />

      {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
            <h1 className="font-serif font-normal text-white text-[70px] leading-[60px] mb-6">
                Your Smart Financial{" "}
                <span className="text-[#1fa8b0] font-serif font-normal">Companion</span>
            </h1>
            <p className="font-dm-sans font-normal text-white/90 text-lg leading-7 mb-10 max-w-xl mx-auto">
                Take control of your finances with BankLens. Connect your bank accounts, track spending,
                and gain insights into your financial health all in one place.
            </p>
            <div className="flex items-center justify-center gap-5">
                <Link
                    href="/sign-up"
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/30 backdrop-blur-sm text-white font-inter font-normal text-sm px-4 py-2 rounded-md hover:bg-white/20 transition-colors"
                >
                    Start Free Today
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                    href="/sign-in"
                    className="inline-flex items-center text-white font-inter font-normal text-sm px-4 py-2 rounded-md border border-white/20 hover:bg-white/10 transition-colors"
                >
                    Sign In
                </Link>
            </div>
        </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Feature Section
────────────────────────────────────────────── */
function FeatureCard({
    icon,
    title,
    description,
    iconBg,
    delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg: string;
  delay?: string;
}) {
  return (
      <div className={`group rounded-2xl border border-black bg-[#0f0f13] p-7 transition-all duration-300 hover:border-teal-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 animate-fade-up ${delay}`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
  )
}

function FeaturesSection() {
  return (
    <section className="bg-[#111211] py-20 px-10">
      <div className="max-w-[1230px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-white font-serif font-normal text-[40px] leading-9 mb-5 animate-fade-up">
            Everything you need to manage your money
          </h2>
          <p className="text-white/60 font-dm-sans font-normal text-lg leading-7 animate-fade-up anim-delay-1">
            Powerful features to help understand and optimize your finances
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Feature 1 */}
          <FeatureCard
              icon={<CreditCard size={18} className="text-blue-400"/>}
              iconBg={"rgba(59,130,246,0.12)"}
              title={"Connect Your Accounts"}
              description={"Securely link your bank accounts and credit cards with bank-level encryption"}
              delay={"anim-delay-1"}
          />

          {/* Feature 2 */}
          <FeatureCard
              icon={<TrendingUp size={18} className="text-emerald-400"/>}
              iconBg={"rgba(52,211,153,0.1)"}
              title={"Track Spending"}
              description={"Automatically categorize transactions and see where your money goes"}
              delay={"anim-delay-2"}
          />

          {/* Feature 3 */}
          <FeatureCard
              icon={<PieChart size={18} className="text-violet-400"/>}
              iconBg={"rgba(167,139,250,0.1)"}
              title={"Financial Insights"}
              description={"Get personalized insights and visualizations of your financial health"}
              delay={"anim-delay-3"}
          />

          {/* Feature 4 */}
          <FeatureCard
              icon={<Shield size={18} className="text-teal-400"/>}
              iconBg={"rgba(20,184,166,0.12)"}
              title={"Secure & Private"}
              description={"Your data is encrypted and protected with industry-leading security"}
              delay={"anim-delay-4"}
          />

          {/* Feature 5 */}
          <FeatureCard
              icon={<Clock size={18} className="text-amber-400"/>}
              iconBg={"rgba(251,191,36,0.1)"}
              title={"Real-Time Updates"}
              description={"Stay up-to-date with instant notifications for all your transactions"}
              delay={"anim-delay-5"}
          />

          {/* Feature 6 */}
          <FeatureCard
              icon={<Bell size={18} className="text-pink-400"/>}
              iconBg={"rgba(244,114,182,0.1)"}
              title={"Budget Friendly"}
              description={"Set budgets and get alerts when you're close to your limits"}
              delay={"anim-delay-6"}
          />

        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   CTA Section
────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="bg-[#111211] py-20 px-10 lg:py-28 lg:px-[122px]">
      <div
        className="rounded-2xl px-20 py-16 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
        }}
      >
        <h2 className="text-white font-serif font-normal text-[40px] leading-9 mb-5">
          Ready to take control of your finances?
        </h2>
        <p className="text-white/90 font-dm-sans font-normal text-lg leading-7 mb-16">
          Join the thousands of users who trust FinWise with their financial data
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center bg-white/10 border border-white/30 backdrop-blur-sm text-white font-inter font-normal text-sm px-8 py-3 rounded-md hover:bg-white/20 transition-colors"
        >
          Get Started for Free
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Footer
────────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer className="bg-[#111211] border-t border-white/10 px-10 py-12">
      <div className="max-w-[1230px] mx-auto flex items-center justify-between">
        <span className="text-white font-inter font-semibold text-sm">BankLens</span>
        <span className="text-white/60 font-inter font-semibold text-sm">
          © 2026 BankLens. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────
   Root export
────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#111211]">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
