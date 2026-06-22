import type { Metadata } from "next";
import Link from "next/link";
import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getStripe } from "@/lib/stripe";
import { getCustomer } from "@/lib/run";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Welcome — ${BRAND.name}` };
export const dynamic = "force-dynamic";

/** Send the confirmation once per Stripe session (marker file guards refreshes). */
async function sendConfirmationOnce(sessionId: string, token: string, base: string) {
  try {
    const dir = path.join(process.cwd(), "data", "sent");
    await mkdir(dir, { recursive: true });
    const marker = path.join(dir, `${sessionId}.json`);
    try {
      await access(marker);
      return; // already sent
    } catch {
      /* not sent yet */
    }
    const customer = await getCustomer(token);
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        ...orderConfirmationEmail({
          name: customer.name,
          dashboardUrl: `${base}/dashboard/${token}`,
        }),
      });
    }
    await writeFile(marker, JSON.stringify({ sentAt: new Date().toISOString() }), "utf8");
  } catch {
    /* non-fatal */
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let paid = false;
  let token = "";
  const stripe = getStripe();
  if (stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      token = session.metadata?.token ?? "";
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";
      if (paid && token) await sendConfirmationOnce(session_id, token, base);
    } catch {
      /* generic confirmation below */
    }
  }

  const dashHref = token ? `/dashboard/${token}` : "/dashboard";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 pt-24 pb-32 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-safe/15 text-2xl text-safe">
          ✓
        </div>
        <h1 className="font-display" style={{ fontSize: "var(--text-section)" }}>
          {paid ? "Payment received." : "You're all set."}
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Your subscription is active and your removal is queued. We&apos;ve
          emailed your confirmation — and you can watch every removal land, with
          screenshot proof, on your dashboard.
        </p>
        <Link
          href={dashHref}
          className="mt-8 inline-block rounded-full bg-safe px-7 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          Go to my dashboard →
        </Link>
      </main>
      <Footer />
    </>
  );
}
