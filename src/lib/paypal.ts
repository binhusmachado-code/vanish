/**
 * PayPal REST helpers — no SDK dependency, just fetch against the REST API.
 * Reads credentials from env so the app builds/runs without them configured.
 *
 *   PAYPAL_CLIENT_ID      (server)
 *   PAYPAL_SECRET         (server)
 *   PAYPAL_ENV            "sandbox" | "live"  (default: sandbox)
 *   NEXT_PUBLIC_PAYPAL_CLIENT_ID  (client SDK — same value as PAYPAL_CLIENT_ID)
 */

function apiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error("PayPal is not configured.");

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal auth failed.");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createOrder(opts: {
  amount: number;
  description: string;
  planId: string;
  customId?: string;
}): Promise<string> {
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: opts.amount.toFixed(2) },
          description: opts.description,
          custom_id: opts.customId ?? "",
        },
      ],
    }),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !data.id) {
    throw new Error(data.message ?? "Could not create PayPal order.");
  }
  return data.id;
}

export async function captureOrder(
  orderId: string,
): Promise<{ status: string; payerEmail: string | null; customId: string | null }> {
  const token = await accessToken();
  const res = await fetch(
    `${apiBase()}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const data = (await res.json()) as {
    status?: string;
    message?: string;
    payer?: { email_address?: string };
    purchase_units?: { custom_id?: string }[];
  };
  if (!res.ok || data.status !== "COMPLETED") {
    throw new Error(data.message ?? "Payment was not completed.");
  }
  return {
    status: data.status,
    payerEmail: data.payer?.email_address ?? null,
    customId: data.purchase_units?.[0]?.custom_id ?? null,
  };
}
