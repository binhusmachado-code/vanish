import Stripe from "stripe";

/**
 * Lazily create the Stripe client so the app builds and renders even when
 * STRIPE_SECRET_KEY isn't set yet. Routes that need Stripe check for null
 * and return a clear error.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
