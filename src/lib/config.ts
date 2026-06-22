/**
 * Central brand + commercial config.
 * Rename the brand and adjust pricing here — nothing else hardcodes these.
 */

export const BRAND = {
  name: "VANISH",
  tagline: "Erase yourself from the internet.",
  domain: "vanish.example", // replace with your real domain
  supportEmail: "help@vanish.example",
} as const;

/** Honest, defensible coverage claim for an automation-first MVP. */
export const COVERAGE = {
  brokerCount: 200, // US people-search sites & data brokers we submit opt-outs to
  rescanDays: 90, // brokers re-list data; we re-check on this cadence
} as const;

export type PlanId = "scan" | "individual" | "pro" | "family";

export interface Plan {
  id: PlanId;
  name: string;
  priceYearly: number; // USD, billed annually
  priceMonthlyEquivalent: number; // shown as "$X/mo billed annually"
  blurb: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

/**
 * Pricing positioned just under the incumbents:
 * DeleteMe $129/yr · Incogni $95/yr · Optery $39–249/yr.
 */
export const PLANS: Plan[] = [
  {
    id: "scan",
    name: "Free Exposure Scan",
    priceYearly: 0,
    priceMonthlyEquivalent: 0,
    blurb: "See exactly where you're exposed. No card required.",
    cta: "Run free scan",
    features: [
      "Full exposure report",
      "See which data brokers list you",
      "What they're selling about you",
      "No obligation",
    ],
  },
  {
    id: "individual",
    name: "Individual",
    priceYearly: 99,
    priceMonthlyEquivalent: 8.25,
    blurb: "Get removed and stay removed.",
    cta: "Get protected",
    features: [
      `Removal from ${COVERAGE.brokerCount}+ data brokers`,
      "Screenshot proof of every removal",
      `Auto re-scan every ${COVERAGE.rescanDays} days`,
      "Quarterly privacy report",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceYearly: 149,
    priceMonthlyEquivalent: 12.42,
    highlighted: true,
    blurb: "Maximum coverage for high-exposure people.",
    cta: "Go Pro",
    features: [
      "Everything in Individual",
      "Priority removal queue",
      "Monthly re-scans",
      "Custom removal requests",
      "Dedicated privacy advisor",
    ],
  },
  {
    id: "family",
    name: "Family",
    priceYearly: 249,
    priceMonthlyEquivalent: 20.75,
    blurb: "Protect up to 4 people in one plan.",
    cta: "Protect my family",
    features: [
      "Up to 4 family members",
      "Everything in Pro",
      "Shared family dashboard",
      "Best value per person",
    ],
  },
];

/**
 * Coupon codes. 100% off = a comped order (used for founder testing before
 * Stripe is wired; carries over to Stripe coupons later).
 */
export const COUPONS: Record<string, { percentOff: number; label: string }> = {
  "FOUNDER-FREE": { percentOff: 100, label: "Founder access — free" },
};

export function validateCoupon(code: string) {
  return COUPONS[code.trim().toUpperCase()] ?? null;
}

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Free scan",
    body: "We search the data brokers and people-search sites and show you everywhere your name, address, phone, and family are exposed.",
  },
  {
    step: "02",
    title: "You subscribe",
    body: "Pick a plan and securely authorize us to act on your behalf. Your details are encrypted — only used to file removals.",
  },
  {
    step: "03",
    title: "We erase you",
    body: "Our engine files opt-out and deletion requests across every broker that lists you, capturing a screenshot of each one.",
  },
  {
    step: "04",
    title: "We keep watch",
    body: "Brokers re-list data over time. We re-scan automatically and remove you again — so you stay invisible.",
  },
];

export const FAQ = [
  {
    q: "Can you really remove ALL my information?",
    a: "We remove you from the data brokers and people-search sites that resell your personal info — the main source of your exposure. We can't control what you post publicly or what your bank/government holds. And because brokers re-collect data, removal is ongoing, not one-and-done. That's why it's a subscription: we keep removing you as you reappear.",
  },
  {
    q: "How do I know it actually worked?",
    a: "We capture a screenshot of every single opt-out we file and put it in your dashboard. You see the proof, broker by broker.",
  },
  {
    q: "Is this legal?",
    a: "Yes. US privacy laws (and CCPA in California) give you the right to have data brokers delete and stop selling your information. We simply exercise that right on your behalf, with your authorization.",
  },
  {
    q: "How long until I'm removed?",
    a: "Most opt-outs are filed within days. Brokers are legally required to process them, but some take 2–6 weeks to fully drop your listing. You'll watch progress live in your dashboard.",
  },
  {
    q: "Is my data safe with you?",
    a: "Your information is encrypted at rest, only used to file removals, and never sold or shared. Ever. That would defeat the entire purpose.",
  },
];
