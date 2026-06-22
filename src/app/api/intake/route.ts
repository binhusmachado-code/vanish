import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { CustomerProfile, RunResult } from "@/lib/engine-types";
import { validateCoupon } from "@/lib/config";
import { BROKERS } from "@/lib/brokers";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { getSupabase } from "@/lib/db";

export const runtime = "nodejs";

function baseUrl(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:4000"
  );
}

function seededRun(profile: CustomerProfile, token: string): RunResult {
  return {
    runId: token,
    profileId: profile.id,
    customerName: profile.fullName,
    startedAt: new Date().toISOString(),
    brokers: BROKERS.map((b) => ({
      brokerId: b.domain,
      brokerName: b.name,
      listed: "unknown",
      exposed: [],
      profileUrls: [],
      status: "queued",
      screenshots: [],
    })),
  };
}

export async function POST(req: Request) {
  let body: Partial<CustomerProfile>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Validate at the boundary — never trust the client.
  const errors: string[] = [];
  if (!body.fullName?.trim()) errors.push("Full legal name is required.");
  if (!body.dob?.trim()) errors.push("Date of birth is required.");
  if (!body.verificationEmail?.trim())
    errors.push("A verification email is required.");
  if (!Array.isArray(body.addresses) || body.addresses.length === 0)
    errors.push("At least one address is required.");
  if (!body.authorization?.agreed)
    errors.push("Authorization is required before we can act for you.");
  if (!body.authorization?.signedName?.trim())
    errors.push("A typed signature is required to authorize removals.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const coupon = body.couponCode && validateCoupon(body.couponCode);
  const profile: CustomerProfile = {
    id: `cust-${Date.now()}`,
    fullName: body.fullName!.trim(),
    nameVariants: (body.nameVariants ?? []).map((v) => v.trim()).filter(Boolean),
    dob: body.dob!.trim(),
    emails: (body.emails ?? []).map((v) => v.trim()).filter(Boolean),
    verificationEmail: body.verificationEmail!.trim(),
    phones: (body.phones ?? []).map((v) => v.trim()).filter(Boolean),
    addresses: (body.addresses ?? []).map((a) => ({
      street: (a.street ?? "").trim(),
      city: (a.city ?? "").trim(),
      state: (a.state ?? "").trim().toUpperCase(),
      zip: (a.zip ?? "").trim(),
      current: Boolean(a.current),
    })),
    relatives: (body.relatives ?? []).map((v) => v.trim()).filter(Boolean),
    authorization: {
      agreed: true,
      signedName: body.authorization!.signedName!.trim(),
      signedAt: new Date().toISOString(),
    },
    couponCode: coupon ? body.couponCode!.trim().toUpperCase() : undefined,
  };

  // Unguessable tracking token → the customer's private dashboard URL.
  const token = randomUUID();
  const dashboardUrl = `${baseUrl(req)}/dashboard/${token}`;
  let persisted = true;

  try {
    const db = getSupabase();

    // 1) Create customer record and get its ID.
    const run = seededRun(profile, token);
    const { data: customerData, error } = await db
      .from("customers")
      .insert({
        token,
        full_name: profile.fullName,
        email: profile.nameVariants.join(", "),
        verified_email: profile.verificationEmail,
        dob: profile.dob,
        profile_data: profile as unknown as Record<string, unknown>,
        status: "created",
      })
      .select("id");

    if (error || !customerData || customerData.length === 0) throw error;
    const customerId = customerData[0].id;

    // 2) Create removal run record.
    const { error: runError } = await db.from("removal_runs").insert({
      customer_id: customerId,
      token,
      run_data: run as unknown as Record<string, unknown>,
      status: "queued",
    });

    if (runError) throw runError;
  } catch {
    persisted = false;
  }

  // Send the "removal started" confirmation now if the order is already
  // complete (free founder comp). Paid orders send it after payment captures.
  if (coupon && coupon.percentOff >= 100) {
    await sendEmail({
      to: profile.verificationEmail,
      ...orderConfirmationEmail({ name: profile.fullName, dashboardUrl }),
    });
  }

  return NextResponse.json({ ok: true, profileId: profile.id, token, dashboardUrl, persisted });
}
