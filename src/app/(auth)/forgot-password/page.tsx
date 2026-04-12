import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { forgotPasswordAction } from "@/app/actions";
import { UrlProvider } from "@/components/url-provider";
import BackgroundImage from "@/components/landing/BackgroundImage";

export default async function ForgotPassword(props: {
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
    <div className="relative overflow-hidden flex min-h-screen w-full items-center justify-center">
      <BackgroundImage />

      <div className="relative z-10 flex w-full items-center justify-center px-4">
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
              <h1 className="text-white text-center text-[40px] leading-9 font-normal" style={{ fontFamily: "Georgia, serif" }}>
                Forgot Your Password?
              </h1>
            </div>
            {/* Subtitle */}
            <p className="font-inter font-normal text-center pt-2 text-white/60 text-sm leading-5">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full rounded-2xl max-w-md rounded-lg border border-border p-6 shadow-sm"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <UrlProvider>
              <form className="flex flex-col space-y-6">

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-white font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="font-inter font-normal text-white/50 text-sm leading-5 rounded-md bg-transparent border border-white/15 px-4 py-2 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <SubmitButton
                  formAction={forgotPasswordAction}
                  pendingText="Sending reset link..."
                  className="w-full bg-white text-black font-inter font-normal text-sm leading-5 py-2 rounded-md hover:bg-white/90 transition-colors"
                >
                  Reset Password
                </SubmitButton>

                <FormMessage message={searchParams} />
              </form>
            </UrlProvider>
          </div>

          {/* Sign In link */}
          <div className="flex items-center gap-[3px] px-[10px] py-[10px]">
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
          <SmtpMessage />
        </div>
      </div>
    </div>
  );
}
