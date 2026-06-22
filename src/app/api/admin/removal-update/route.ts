import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RunResult, RemovalStatus } from "@/lib/engine-types";
import { getCustomer } from "@/lib/run";
import { sendEmail } from "@/lib/email";
import { removalUpdateEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/**
 * Operator-only: mark a broker's removal status for a customer and (when it's
 * confirmed/removed) email the customer the good news. The customer's dashboard
 * reflects it immediately.
 *
 * Auth: requires header `x-admin-token: <ADMIN_TOKEN>` in production. On local
 * dev (no VERCEL env) it's open for convenience.
 */
function authorized(req: Request): boolean {
  if (!process.env.VERCEL) return true; // local dev
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected) && req.headers.get("x-admin-token") === expected;
}

function baseUrl(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:4000"
  );
}

const NOTIFY: RemovalStatus[] = ["removed-confirmed", "submitted"];

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { token?: string; brokerId?: string; status?: RemovalStatus; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { token, brokerId, status, note } = body;
  if (!token || !/^[a-zA-Z0-9-]+$/.test(token) || !brokerId || !status) {
    return NextResponse.json(
      { error: "token, brokerId and status are required." },
      { status: 400 },
    );
  }

  const file = path.join(process.cwd(), "public", "runs", token, "result.json");
  let run: RunResult;
  try {
    run = JSON.parse(await readFile(file, "utf8")) as RunResult;
  } catch {
    return NextResponse.json({ error: "Customer run not found." }, { status: 404 });
  }

  const broker = run.brokers.find(
    (b) => b.brokerId === brokerId || b.brokerName === brokerId,
  );
  if (!broker) {
    return NextResponse.json({ error: "Broker not found in run." }, { status: 404 });
  }

  broker.status = status;
  if (note) broker.notes = note;
  broker.finishedAt = new Date().toISOString();

  try {
    await writeFile(file, JSON.stringify(run, null, 2), "utf8");
  } catch {
    return NextResponse.json({ error: "Could not save update." }, { status: 500 });
  }

  // Email the customer when a removal is confirmed/filed.
  let emailed = false;
  if (NOTIFY.includes(status)) {
    const customer = await getCustomer(token);
    if (customer?.email) {
      const r = await sendEmail({
        to: customer.email,
        ...removalUpdateEmail({
          name: customer.name,
          brokerName: broker.brokerName,
          dashboardUrl: `${baseUrl(req)}/dashboard/${token}`,
        }),
      });
      emailed = r.ok;
    }
  }

  return NextResponse.json({ ok: true, broker: broker.brokerName, status, emailed });
}
