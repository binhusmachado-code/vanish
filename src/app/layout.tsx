import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import { BRAND } from "@/lib/config";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "We remove your name, address, phone, and family from data brokers and people-search sites — with screenshot proof of every removal.",
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Erase yourself from data brokers and people-search sites. Screenshot proof of every removal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="grain antialiased">{children}</body>
    </html>
  );
}
