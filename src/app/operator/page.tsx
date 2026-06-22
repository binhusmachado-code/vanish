import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OperatorConsole } from "@/components/operator/OperatorConsole";
import { getAllCustomers } from "@/lib/customers";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Operator console — ${BRAND.name}`,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function OperatorPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  // Operator-only. Open on local dev; on production require the admin key.
  const { key } = await searchParams;
  if (process.env.VERCEL && key !== process.env.ADMIN_TOKEN) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-md px-5 pt-32 pb-40 text-center">
          <h1 className="font-display text-3xl">Operator access only</h1>
          <p className="mt-4 text-muted">
            Append <code className="text-bone">?key=YOUR_ADMIN_TOKEN</code> to the
            URL to manage customer removals.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const customers = await getAllCustomers();
  const totalTodos = customers.reduce((n, c) => n + c.progress.todos, 0);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 pt-14 pb-24">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
            Operator console
          </p>
          <h1 className="font-display" style={{ fontSize: "var(--text-hero)" }}>
            Run the removals.
          </h1>
          <p className="mt-4 text-muted">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
            {totalTodos > 0 && (
              <> · <span className="text-amber">{totalTodos} broker steps need you</span></>
            )}
            . Mark a broker removed and the customer is emailed automatically.
          </p>
        </div>
        <OperatorConsole customers={customers} />
      </main>
      <Footer />
    </>
  );
}
