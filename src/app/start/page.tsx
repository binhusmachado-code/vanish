import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StartFlow } from "@/components/StartFlow";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Start your removal — ${BRAND.name}`,
};

export default function StartPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 pt-14 pb-24">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
            Get protected
          </p>
          <h1 className="font-display" style={{ fontSize: "var(--text-hero)" }}>
            Tell us who to erase.
          </h1>
          <p className="mt-5 text-lg text-muted">
            A few details let us find and remove the right listings — and confirm
            they&apos;re actually you, not a stranger who shares your name.
          </p>
        </div>
        <StartFlow />
      </main>
      <Footer />
    </>
  );
}
