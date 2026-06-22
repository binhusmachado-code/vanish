import { NextResponse } from "next/server";
import { BROKERS } from "@/lib/brokers";
import { COVERAGE } from "@/lib/config";

/** US states — used for light input validation. */
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

interface ScanRequest {
  firstName?: string;
  lastName?: string;
  state?: string;
  email?: string;
}

/**
 * Returns an exposure report: which brokers list people matching this profile.
 * This is a coverage-based preview (these brokers list nearly all US adults);
 * the full per-record scan runs after the customer subscribes and the engine
 * is given authorization. We intentionally do NOT fabricate specific records.
 */
export async function POST(req: Request) {
  let body: ScanRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const state = (body.state ?? "").trim().toUpperCase();
  const email = (body.email ?? "").trim();

  if (firstName.length < 1 || lastName.length < 1) {
    return NextResponse.json(
      { error: "Please enter your first and last name." },
      { status: 400 },
    );
  }
  if (!US_STATES.has(state)) {
    return NextResponse.json(
      { error: "Please select a valid US state." },
      { status: 400 },
    );
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json(
      { error: "Please enter a valid email to see your report." },
      { status: 400 },
    );
  }

  // TODO(engine): persist the lead to Supabase (encrypted) for follow-up,
  // then trigger the real authenticated scan after checkout.

  const exposed = BROKERS.map((b) => ({
    name: b.name.trim(),
    domain: b.domain,
    tier: b.tier,
  }));

  return NextResponse.json({
    name: `${firstName} ${lastName}`,
    state,
    exposedCount: exposed.length,
    totalCovered: COVERAGE.brokerCount,
    brokers: exposed,
  });
}
