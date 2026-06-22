import Link from "next/link";
import { BRAND, COVERAGE } from "@/lib/config";

/**
 * Editorial hero. The headline literally redacts the user's exposed data —
 * the product promise rendered as motion.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:pt-28"
    >
      <p className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-ink-soft px-4 py-1.5 text-xs tracking-wide text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-exposed" />
        Your home address is for sale right now
      </p>

      <h1
        id="hero-heading"
        className="rise max-w-4xl font-display leading-[0.95]"
        style={{ fontSize: "var(--text-hero)", animationDelay: "60ms" }}
      >
        Your name. Address. Phone.
        <br />
        Family.{" "}
        <span className="relative inline-block">
          <span className="relative z-10 text-ink">Exposed.</span>
          <span
            aria-hidden
            className="absolute inset-x-[-4px] inset-y-1 z-0 origin-left bg-bone"
            style={{ animation: "redact 2.6s var(--ease-out-expo) 0.6s both" }}
          />
        </span>
      </h1>

      <p
        className="rise mt-7 max-w-xl text-lg leading-relaxed text-muted"
        style={{ animationDelay: "140ms" }}
      >
        Data brokers collect your personal life and sell it to anyone with a
        credit card. {BRAND.name} finds every site that lists you and erases you
        — with screenshot proof of each removal.
      </p>

      <div
        className="rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "220ms" }}
      >
        <Link
          href="/scan"
          className="rounded-full bg-safe px-7 py-3.5 text-center font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          See where you&apos;re exposed — free
        </Link>
        <Link
          href="/pricing"
          className="rounded-full border border-line px-7 py-3.5 text-center font-medium text-bone transition-colors hover:bg-ink-soft"
        >
          View plans
        </Link>
      </div>

      <dl
        className="rise mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3"
        style={{ animationDelay: "300ms" }}
      >
        {[
          [`${COVERAGE.brokerCount}+`, "data brokers covered"],
          ["Every removal", "backed by a screenshot"],
          [`Every ${COVERAGE.rescanDays} days`, "we re-scan & re-remove"],
        ].map(([big, small]) => (
          <div key={small} className="bg-ink-soft p-6">
            <dt className="font-display text-3xl text-safe">{big}</dt>
            <dd className="mt-1 text-sm text-muted">{small}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
