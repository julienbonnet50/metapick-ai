import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@components/ClientLayout";
import { DataProvider } from "@components/DataProviderContext";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetaPick AI",
  description: "Create optimal team compositions and strategies for Brawl Stars using AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {/* Navbar + Client State handled separately */}
          <DataProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </DataProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    
  );
}
