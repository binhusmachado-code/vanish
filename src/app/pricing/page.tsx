import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PricingCards } from "@/components/PricingCards";
import { Faq } from "@/components/Faq";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Pricing — ${BRAND.name}`,
};

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 pt-20 pb-12">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
            Plans
          </p>
          <h1 className="font-display" style={{ fontSize: "var(--text-hero)" }}>
            Pick your plan.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Every paid plan removes you from the data brokers and screenshots the
            proof. Cancel anytime. Start with a free scan if you&apos;re not
            sure.
          </p>
        </div>
        <PricingCards />

        <p className="mt-10 text-center text-sm text-muted">
          Prices in USD. Removal is ongoing because brokers re-collect data — we
          keep removing you for as long as you&apos;re subscribed.
        </p>
      </main>
      <Faq />
      <Footer />
    </>
  );
}
