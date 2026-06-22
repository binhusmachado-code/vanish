import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ScanWidget } from "@/components/ScanWidget";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Free exposure scan — ${BRAND.name}`,
};

export default function ScanPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
            Free scan
          </p>
          <h1 className="font-display" style={{ fontSize: "var(--text-hero)" }}>
            What does the internet sell about you?
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Enter your name and state. We&apos;ll show you which data brokers are
            listing your personal information right now — for free.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted">
            {[
              "No credit card required",
              "See your real exposure in under a minute",
              "We never sell your information",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="text-safe">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ScanWidget />
      </main>
      <Footer />
    </>
  );
}
