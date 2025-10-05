import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

/**
 * Font configurations using Geist fonts for professional appearance
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata for SentinelAI
 */
export const metadata: Metadata = {
  title: "SentinelAI - AI Agent Security Monitoring",
  description:
    "Professional AI agent security monitoring platform for tracking, analyzing, and securing AI agent executions",
  keywords: [
    "AI security",
    "agent monitoring",
    "security platform",
    "AI governance",
  ],
};

/**
 * Root layout component that provides theme support and font configuration
 * Wraps the entire application with necessary providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
