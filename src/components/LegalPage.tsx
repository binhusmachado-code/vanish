import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

/** Shared shell for legal documents. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pt-14 pb-24">
        <h1 className="font-display" style={{ fontSize: "var(--text-section)" }}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated {updated}</p>

        <div className="mt-6 rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm text-muted">
          Starting template — have it reviewed by a lawyer in your operating
          jurisdiction before you launch. It is not legal advice.
        </div>

        <div className="legal mt-10 space-y-6 text-muted">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-bone">{heading}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
