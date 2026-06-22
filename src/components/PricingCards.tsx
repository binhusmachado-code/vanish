import Link from "next/link";
import { PLANS, type Plan } from "@/lib/config";

function PlanCard({ plan }: { plan: Plan }) {
  const isFree = plan.priceYearly === 0;
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-7 ${
        plan.highlighted
          ? "border-safe bg-ink-raise"
          : "border-line bg-ink-soft"
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-7 rounded-full bg-safe px-3 py-1 text-xs font-semibold text-ink">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.blurb}</p>

      <div className="mt-6 flex items-baseline gap-1">
        {isFree ? (
          <span className="font-display text-4xl">$0</span>
        ) : (
          <>
            <span className="font-display text-4xl">
              ${plan.priceMonthlyEquivalent.toFixed(2)}
            </span>
            <span className="text-sm text-muted">/mo</span>
          </>
        )}
      </div>
      {!isFree && (
        <p className="mt-1 text-xs text-muted">
          ${plan.priceYearly}/yr · billed annually
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span className="mt-0.5 text-safe">✓</span>
            <span className="text-muted">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={isFree ? "/scan" : `/start?plan=${plan.id}`}
        className={`mt-7 rounded-full px-5 py-3 text-center font-medium transition-transform hover:-translate-y-0.5 ${
          plan.highlighted || isFree
            ? "bg-safe text-ink"
            : "border border-line text-bone hover:bg-ink-raise"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-4">
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
