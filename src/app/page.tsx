import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { RemovalStats } from "@/components/RemovalStats";
import { Proof } from "@/components/Proof";
import { Trust } from "@/components/Trust";
import { PricingCards } from "@/components/PricingCards";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <RemovalStats />
        <Proof />
        <Trust />

        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
              Pricing
            </p>
            <h2
              className="font-display"
              style={{ fontSize: "var(--text-section)" }}
            >
              Cheaper than getting doxxed.
            </h2>
          </div>
          <PricingCards />
        </section>

        <Faq />

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-28">
          <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-ink-raise to-ink-soft p-10 text-center sm:p-16">
            <h2
              className="mx-auto max-w-2xl font-display"
              style={{ fontSize: "var(--text-section)" }}
            >
              Find out what the internet is selling about you.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-muted">
              The scan is free and takes under a minute. No card, no catch.
            </p>
            <Link
              href="/scan"
              className="mt-8 inline-block rounded-full bg-safe px-8 py-4 font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Run my free exposure scan
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
