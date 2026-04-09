import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import { UrlProvider } from "@/components/url-provider";

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
    <div
      className="banklens-bg flex flex-col items-center justify-center min-h-screen px-4 py-8"
      style={{ backgroundColor: "#0F1117" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
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
          style={{ fontFamily: "Syne, sans-serif", color: "#ffffff" }}
        >
          BankLens
        </span>
      </div>

      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: "#181C27",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <UrlProvider>
          <form className="flex flex-col space-y-6">
            <div className="space-y-1 text-center">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "Syne, sans-serif", color: "#ffffff" }}
              >
                Create your account
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk, sans-serif" }}>
                Already have an account?{" "}
                <Link
                  className="font-medium hover:underline transition-all"
                  href="/sign-in"
                  style={{ color: "#00D4AA" }}
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  minLength={6}
                  required
                  className="w-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                />
              </div>
            </div>

            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="w-full py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: "#00D4AA",
                color: "#0F1117",
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 600,
              }}
            >
              Create Account
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </UrlProvider>
      </div>
      <SmtpMessage />
    </div>
  );
}
