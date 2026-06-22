import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RunView, DashboardEmpty } from "@/components/dashboard/RunView";
import { getLatestRun } from "@/lib/run";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Dashboard — ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const run = await getLatestRun();
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-24">
        {run ? <RunView run={run} /> : <DashboardEmpty />}
      </main>
      <Footer />
    </>
  );
}
