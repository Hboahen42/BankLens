"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, TrendingUp, PieChart, Shield, Clock, Bell } from "lucide-react";

/* ──────────────────────────────────────────────
   Feature card data
────────────────────────────────────────────── */
const features = [
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227466-node-I33%3A44%3B33%3A33-1775890227255.png"
        alt="Connect Your Account icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Connect Your Account",
    description: "Securely link your bank accounts and credit cards with bank-level encryption",
  },
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227421-node-I33%3A54%3B33%3A33-1775890227262.png"
        alt="Track Spending icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Track Spending",
    description: "Automatically categorize transactions and see where your money goes",
  },
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227438-node-I33%3A63%3B36%3A182-1775890227262.png"
        alt="Financial Insights icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Financial Insights",
    description: "Get personalized insights and visualizations of your financial health",
  },
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227435-node-I33%3A72%3B36%3A152-1775890227262.png"
        alt="Secure & Private icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Secure & Private",
    description: "Your data is encrypted and protected with industry-leading security",
  },
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227417-node-I33%3A81%3B36%3A206-1775890227262.png"
        alt="Real-Time Updates icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Real-Time Updates",
    description: "Stay up-to-date with instant notifications for all your transaction",
  },
  {
    icon: (
      <img
        src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227443-node-I33%3A90%3B36%3A230-1775890227263.png"
        alt="Budget Friendly icon"
        className="w-6 h-6 object-contain"
      />
    ),
    title: "Budget Friendly",
    description: "Set budgets and get alerts when you're close to your limits",
  },
];

/* ──────────────────────────────────────────────
   Navbar
────────────────────────────────────────────── */
function LandingNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-4">
      <span className="text-white font-inter font-bold text-2xl tracking-tight">FinWise</span>
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
      <div className="absolute inset-0">
        <img
          src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890226807-node-1%3A4-1775890226628.png"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <LandingNavbar />

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="font-inter font-normal text-white text-[70px] leading-[60px] mb-6">
          Your Smart Financial{" "}
          <span className="text-[#1fa8b0] font-inter font-normal">Companion</span>
        </h1>
        <p className="font-dm-sans font-normal text-white/90 text-lg leading-7 mb-10 max-w-xl mx-auto">
          Take control of your finances with FinWise. Connect your bank accounts, track spending,
          and gain insights into your financial health all in one place.
        </p>
        <div className="flex items-center justify-center gap-5">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/30 backdrop-blur-sm text-white font-inter font-normal text-sm px-4 py-2 rounded-md hover:bg-white/20 transition-colors"
          >
            Start Free Today
            <img
              src="https://storage.googleapis.com/tempo-image-previews/figma-exports%2Fuser_3C3xQVlgsweckJrU0biFa9McaTF-1775890227419-node-1%3A8-1775890227351.png"
              alt="arrow"
              className="w-4 h-4 object-contain"
            />
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#181c1c] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
      {/* Icon container */}
      <div className="w-10 h-10 bg-[#1f2929] border border-white/10 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-white font-inter font-semibold text-lg leading-7 mb-2">{title}</h3>
      <p className="text-white/60 font-inter font-normal text-sm leading-5">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="bg-[#111211] py-20 px-10">
      <div className="max-w-[1230px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-white font-inter font-normal text-[40px] leading-9 mb-5">
            Everything you need to manage your money
          </h2>
          <p className="text-white/60 font-dm-sans font-normal text-lg leading-7">
            Powerful features to help understand and optimize your finances
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
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
    <section className="bg-[#111211] py-28 px-[122px]">
      <div
        className="rounded-2xl px-20 py-16 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
        }}
      >
        <h2 className="text-white font-inter font-normal text-[40px] leading-9 mb-5">
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
        <span className="text-white font-inter font-semibold text-sm">FinWise</span>
        <span className="text-white/60 font-inter font-semibold text-sm">
          © 2026 FinWise. All rights reserved.
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
