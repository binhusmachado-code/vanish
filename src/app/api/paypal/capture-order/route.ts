import { NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal";
import { getCustomer } from "@/lib/run";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

function baseUrl(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:4000"
  );
}

export async function POST(req: Request) {
  let body: { orderID?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.orderID) {
    return NextResponse.json({ error: "Missing order." }, { status: 400 });
  }

  try {
    const result = await captureOrder(body.orderID);

    // Send the "removal started" confirmation to the paying customer.
    const token = result.customId;
    if (token) {
      const customer = await getCustomer(token);
      const to = customer?.email ?? result.payerEmail;
      if (to) {
        await sendEmail({
          to,
          ...orderConfirmationEmail({
            name: customer?.name ?? "there",
            dashboardUrl: `${baseUrl(req)}/dashboard/${token}`,
          }),
        });
      }
    }

    return NextResponse.json({ ok: true, status: result.status, token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
