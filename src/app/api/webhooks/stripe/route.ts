import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const db = getSupabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Fetch the customer by Stripe session ID
        const { data: customers, error } = await db
          .from("customers")
          .select("*")
          .eq("stripe_customer_id", session.customer)
          .single();

        if (error || !customers) {
          console.error("Customer not found for session:", session.id);
          break;
        }

        // Update customer subscription status
        await db
          .from("customers")
          .update({
            subscription_id: session.subscription as string,
            status: "active",
          })
          .eq("id", customers.id);

        // Update payment record
        await db
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        // Send confirmation email
        const profileData = customers.profile_data as {
          fullName: string;
        };
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/${customers.token}`;

        await sendEmail({
          to: customers.verified_email,
          ...orderConfirmationEmail({
            name: profileData.fullName,
            dashboardUrl,
          }),
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const paymentIntentId = (invoice as unknown as { payment_intent?: string })
          .payment_intent;
        if (paymentIntentId) {
          await db
            .from("payments")
            .update({ status: "failed" })
            .eq("stripe_payment_intent_id", paymentIntentId);
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
