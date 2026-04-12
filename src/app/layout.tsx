import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "BankLens — Your Smart Financial Companion",
  description: "Take control of your finances with BankLens. Connect your bank accounts, track spending, and gain insights into your financial health.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
            src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
            strategy="beforeInteractive"
        />
      </head>
      
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="Dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
