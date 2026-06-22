import { NextResponse } from "next/server";
import { createOrder, isPayPalConfigured } from "@/lib/paypal";
import { getPlan, validateCoupon } from "@/lib/config";

export const runtime = "nodejs";

interface Body {
  planId?: string;
  profileId?: string;
  token?: string;
  couponCode?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const plan = getPlan(body.planId ?? "");
  if (!plan || plan.priceYearly === 0) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  // 100%-off coupon → free, no PayPal order needed.
  const coupon = body.couponCode ? validateCoupon(body.couponCode) : null;
  if (coupon && coupon.percentOff >= 100) {
    return NextResponse.json({ free: true });
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add PayPal credentials." },
      { status: 503 },
    );
  }

  try {
    const orderID = await createOrder({
      amount: plan.priceYearly,
      description: `${plan.name} — data removal (annual)`,
      planId: plan.id,
      customId: body.token || body.profileId,
    });
    return NextResponse.json({ orderID });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
