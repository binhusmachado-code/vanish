import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RunView, DashboardEmpty } from "@/components/dashboard/RunView";
import { getRunByToken } from "@/lib/run";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Your removal — ${BRAND.name}`,
  robots: { index: false, follow: false }, // private link — keep out of search
};
export const dynamic = "force-dynamic";

export default async function CustomerDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const run = await getRunByToken(token);
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
