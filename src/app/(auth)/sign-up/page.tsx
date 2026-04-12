import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signUpAction } from "@/app/actions";
import { UrlProvider } from "@/components/url-provider";
import { Check } from "lucide-react";
import BackgroundImage from "@/components/landing/BackgroundImage";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden flex min-h-screen w-full">
      <BackgroundImage />

      {/* ── Left Panel: Sign Up Form ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6">

          {/* Header */}
          <div className="flex flex-col items-center gap-0 w-full">
            {/* Logo wordmark */}
            <div className="flex flex-col items-center pb-6 w-full animate-fade-up anim-delay-1">
              <Link className="font-inter font-bold text-white text-2xl leading-8"
                    href="/"
              >
                BankLens
              </Link>
            </div>
            {/* Heading */}
            <div className="flex flex-col items-center pb-2 w-full animate-fade-up anim-delay-2">
              <h1 className="text-white text-center text-[40px] leading-9 font-normal" style={{ fontFamily: "Georgia, serif" }}>
                Create Your Account!
              </h1>
            </div>
            {/* Subtitle */}
            <p className="font-inter font-normal text-white/60 text-sm leading-5 animate-fade-up anim-delay-3 text-center">
              Get started with BankLens today
            </p>
          </div>

          {/* Form Card */}
          <div
            className="w-full rounded-2xl px-8.75 py-8.5 flex flex-col gap-2.5 animate-fade-up anim-delay-4"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <UrlProvider>
              <form className="flex flex-col gap-2.5">
                {/* Full Name Field */}
                <div className="flex flex-col gap-1.25 p-1">
                  <label htmlFor="full_name" className="font-inter font-normal text-white text-sm leading-5 px-1">
                    Full Name
                  </label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                    style={{ backgroundColor: "transparent" }}
                  />
                </div>

                {/* Email Field */}
                <div className="flex flex-col gap-1.25 p-1">
                  <label htmlFor="email" className="font-inter font-normal text-white text-sm leading-5 px-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                    style={{ backgroundColor: "transparent" }}
                  />
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.25 p-1">
                  <label htmlFor="password" className="font-inter font-normal text-white text-sm leading-5 px-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter a strong password"
                    minLength={6}
                    required
                    className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                    style={{ backgroundColor: "transparent" }}
                  />
                  <span className="font-inter font-normal text-white/40 text-[10px] leading-4 px-1">
                    Must be at least 6 characters
                  </span>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col gap-2.5">
                  <SubmitButton
                    formAction={signUpAction}
                    pendingText="Creating account..."
                    className="w-full bg-white text-black font-inter font-normal text-sm leading-5 py-2 rounded-md hover:bg-white/90 transition-colors"
                  >
                    Create Account
                  </SubmitButton>
                </div>

                <FormMessage message={searchParams} />
              </form>
            </UrlProvider>
          </div>

          {/* Sign In link */}
          <div className="flex items-center gap-0.75 px-2.5 py-2.5 animate-fade-up anim-delay-5">
            <span className="font-inter font-normal text-white/60 text-sm leading-5">
              Already have an account?
            </span>
            <Link
              href="/sign-in"
              className="font-inter font-semibold text-[#1fa8b0] text-sm leading-5 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Decorative / Branding ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, #0d4a45 0%, #0a3530 40%, #061a18 100%)",
        }}
      >
        {/* Subtle organic blob shapes */}
        <div
          className="absolute -top-20 -right-20 w-105 h-105 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-15 -left-15 w-75 h-75 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #0891b2 0%, transparent 70%)" }}
        />

        {/* FREE TO SPEND card — top right */}
        <div
          className="absolute top-12.5 right-12.5 rounded-2xl px-3.75 py-3 flex flex-col gap-2 min-w-40 animate-float2"
          style={{ backgroundColor: "#0d1f1e", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="font-inter font-normal text-white/60 text-xs leading-4 tracking-widest uppercase">
            Free to Spend
          </span>
          <span className="font-inter font-bold text-[#1fa8b0] text-2xl leading-8">
            $1,330
          </span>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-[#34C759]" />
            <span className="font-inter font-normal text-[#1fa8b0] text-xs leading-4">
              Under budget
            </span>
          </div>
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
          <h2
            className="text-white text-[40px] leading-9 font-normal mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Join thousands
            <br />
            of smart savers
          </h2>
          <p className="font-inter font-normal text-white/60 text-sm leading-5 max-w-70">
            Track spending, build budgets, and reach your financial goals faster
          </p>
        </div>

        {/* SUBSCRIPTIONS card — bottom left */}
        <div
          className="absolute bottom-12.5 left-12.5 rounded-2xl px-3.75 py-3 flex flex-col gap-2 min-w-35 animate-float"
          style={{ backgroundColor: "#0d1f1e", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="font-inter font-normal text-white/60 text-xs leading-4 tracking-widest uppercase">
            Subscriptions
          </span>
          <div className="flex items-baseline gap-0">
            <span className="font-inter font-bold text-white text-2xl leading-8">
              $247
            </span>
            <span className="font-inter font-bold text-white text-2xl leading-8">
              /mo
            </span>
          </div>
          <span className="font-inter font-normal text-[#FF6B6B] text-xs leading-4">
            3 cancelable
          </span>
        </div>
      </div>
    </div>
  );
}
