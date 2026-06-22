import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPlan, validateCoupon } from "@/lib/config";
import { getSupabase } from "@/lib/db";

export const runtime = "nodejs";

interface CheckoutRequest {
  planId?: string;
  email?: string;
  profileId?: string;
  token?: string;
  couponCode?: string;
}

/**
 * Creates a Stripe Checkout Session (subscription) for the chosen plan and
 * returns its hosted-checkout URL. A valid 100%-off coupon short-circuits to a
 * free order (no Stripe needed).
 */
export async function POST(req: Request) {
  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const plan = getPlan(body.planId ?? "");
  if (!plan || plan.priceYearly === 0) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  // 100%-off coupon → free order, skip payment entirely.
  const coupon = body.couponCode ? validateCoupon(body.couponCode) : null;
  if (coupon && coupon.percentOff >= 100) {
    return NextResponse.json({ free: true });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:4000";

  // Discount (non-100%) coupons could be applied here via stripe.coupons; for
  // now we only special-case the founder comp above.
  const amountCents = Math.round(plan.priceYearly * 100);

  try {
    const db = getSupabase();

    // Link Stripe customer to our customer record if using profileId
    if (body.profileId && body.email) {
      const { data: customer } = await db
        .from("customers")
        .select("id, stripe_customer_id")
        .eq("id", body.profileId)
        .single();

      if (customer && !customer.stripe_customer_id) {
        // Create Stripe customer
        const stripeCustomer = await stripe.customers.create({
          email: body.email,
          metadata: { profileId: body.profileId },
        });

        // Update our customer with Stripe ID
        await db
          .from("customers")
          .update({ stripe_customer_id: stripeCustomer.id })
          .eq("id", body.profileId);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            recurring: { interval: "year" },
            product_data: {
              name: `${plan.name} — data removal`,
              description: plan.blurb,
            },
          },
        },
      ],
      metadata: {
        planId: plan.id,
        profileId: body.profileId ?? "",
        token: body.token ?? "",
      },
      success_url: `${origin}/start/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    // Store payment record
    if (body.profileId) {
      await db.from("payments").insert({
        customer_id: body.profileId,
        stripe_session_id: session.id,
        amount_cents: amountCents,
        currency: "usd",
        status: "pending",
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
