import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

import SiteHeader from "./_components/SiteHeader";
import EngagementTracker from "./_components/EngagementTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";
const SITE_DESC =
  process.env.NEXT_PUBLIC_SITE_DESC ?? "Latest news, analysis and stories.";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESC,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable}`}
      suppressHydrationWarning
    >
      <body className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <EngagementTracker />
        <SiteHeader />

        {/* Offset page content so it doesn't sit under the fixed header */}
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}