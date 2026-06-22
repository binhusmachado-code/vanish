"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    paypal?: any;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

interface Props {
  planId: string;
  profileId: string;
  token?: string | null;
  couponCode?: string;
  onSuccess: () => void;
}

/** Renders PayPal Smart Buttons; creates + captures the order via our API. */
export function PayPalCheckout({
  planId,
  profileId,
  token,
  couponCode,
  onSuccess,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    function renderButtons() {
      if (cancelled || !ref.current || !window.paypal) return;
      ref.current.innerHTML = "";
      setReady(true);
      window.paypal
        .Buttons({
          style: { layout: "vertical", shape: "pill", color: "white" },
          createOrder: async () => {
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId, profileId, token, couponCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
            return data.orderID;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const out = await res.json();
            if (!res.ok || !out.ok) {
              setError(out.error ?? "Payment could not be completed.");
              return;
            }
            onSuccess();
          },
          onError: () => setError("Something went wrong with PayPal. Try again."),
        })
        .render(ref.current);
    }

    if (window.paypal) {
      renderButtons();
      return;
    }

    const id = "paypal-sdk";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", renderButtons);
      return () => existing.removeEventListener("load", renderButtons);
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD&intent=capture`;
    script.onload = renderButtons;
    script.onerror = () => setError("Couldn't load PayPal.");
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [planId, profileId, token, couponCode, onSuccess]);

  if (!CLIENT_ID) {
    return (
      <div className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-sm text-muted">
        PayPal isn&apos;t configured yet. Add{" "}
        <code className="text-bone">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and{" "}
        <code className="text-bone">PAYPAL_SECRET</code> to enable payment.
      </div>
    );
  }

  return (
    <div>
      {!ready && (
        <p className="mb-3 text-sm text-muted">Loading secure PayPal checkout…</p>
      )}
      <div ref={ref} />
      {error && <p className="mt-3 text-sm text-exposed">{error}</p>}
    </div>
  );
}
