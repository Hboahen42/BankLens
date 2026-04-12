import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import BackgroundImage from "@/components/landing/BackgroundImage";


interface LoginProps {
  searchParams: Promise<Message>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden flex min-h-screen w-full">
      <BackgroundImage />

      {/* ── Left Panel: Sign In Form ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6">

          {/* Header */}
          <div className="flex flex-col items-center gap-0 w-full">
            {/* Logo wordmark */}
            <div className="flex flex-col items-center pb-6 w-full">
              <Link className="font-inter font-bold text-white text-2xl leading-8"
                    href="/"
              >
                BankLens
              </Link>
            </div>
            {/* Heading */}
            <div className="flex flex-col items-center pb-2 w-full">
              <h1 className="text-white text-[40px] leading-9 font-normal" style={{ fontFamily: "Georgia, serif" }}>
                Welcome Back!
              </h1>
            </div>
            {/* Subtitle */}
            <p className="font-inter font-normal text-white/60 text-sm leading-5">
              Sign in to your account
            </p>
          </div>

          {/* Form Card */}
          <div
            className="w-full rounded-2xl px-[35px] py-[34px] flex flex-col gap-[10px]"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <form className="flex flex-col gap-[10px]">
              {/* Email Field */}
              <div className="flex flex-col gap-[5px] p-1">
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
              <div className="flex flex-col gap-[5px] p-1">
                <label htmlFor="password" className="font-inter font-normal text-white text-sm leading-5 px-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter a strong password"
                  required
                  className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ backgroundColor: "transparent" }}
                />
                <Link
                    className="pt-2 text-right text-xs hover:underline transition-all"
                    href="/forgot-password"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col gap-[10px]">
                <SubmitButton
                  formAction={signInAction}
                  pendingText="Signing in..."
                  className="w-full bg-white text-black font-inter font-normal text-sm leading-5 py-2 rounded-md hover:bg-white/90 transition-colors"
                >
                  Sign In
                </SubmitButton>
              </div>

              <FormMessage message={message} />
            </form>
          </div>

          {/* Sign Up link */}
          <div className="flex items-center gap-[3px] px-[10px] py-[10px]">
            <span className="font-inter font-normal text-white/60 text-sm leading-5">
              Don't have an account?
            </span>
            <Link
              href="/sign-up"
              className="font-inter font-semibold text-[#1fa8b0] text-sm leading-5 hover:underline"
            >
              Sign Up
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
          className="absolute top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #0891b2 0%, transparent 70%)" }}
        />

        {/* NET WORTH card — top right */}
        <div
          className="absolute top-[50px] right-[50px] rounded-2xl px-[15px] py-[12px] flex flex-col gap-2 min-w-[160px]"
          style={{ backgroundColor: "#0d1f1e", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="font-inter font-normal text-white/60 text-xs leading-4 tracking-widest uppercase">
            Net Worth
          </span>
          <span className="font-inter font-bold text-white text-2xl leading-8">
            $128,435
          </span>
          <div className="flex items-center gap-1">
            <ArrowUp className="w-4 h-4 text-[#34C759]" />
            <span className="font-inter font-normal text-[#1fa8b0] text-xs leading-4">
              +2.1% this month
            </span>
          </div>
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
          <h2
            className="text-white text-[40px] leading-9 font-normal mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Your finances,
            <br />
            at a glance
          </h2>
          <p className="font-inter font-normal text-white/60 text-sm leading-5 max-w-[280px]">
            Connect all your accounts and get a complete picture of your financial life
          </p>
        </div>

        {/* MONTHLY SAVINGS card — bottom left */}
        <div
          className="absolute bottom-[50px] left-[50px] rounded-2xl px-[15px] py-[12px] flex flex-col gap-2 min-w-[140px]"
          style={{ backgroundColor: "#0d1f1e", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="font-inter font-normal text-white/60 text-xs leading-4 tracking-widest uppercase">
            Monthly Savings
          </span>
          <span className="font-inter font-bold text-[#1fa8b0] text-2xl leading-8">
            $3,465
          </span>
          <div className="flex items-center gap-1">
            <ArrowUp className="w-4 h-4 text-[#34C759]" />
            <span className="font-inter font-normal text-[#1fa8b0] text-xs leading-4">
              On track
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
