/**
 * Trust & safety. Carries the redaction signature: a line of "your data"
 * sits exposed, then the safety guarantees redact it.
 */
const GUARANTEES = [
  {
    title: "Encrypted, never sold",
    body: "Your details are encrypted at rest and used for one thing only — filing your removals. We never sell or share them. Selling your data is the exact thing we exist to stop.",
  },
  {
    title: "We act as your authorized agent",
    body: "US privacy law lets you appoint an agent to demand deletion on your behalf. You authorize us once, and we exercise your legal right — broker by broker.",
  },
  {
    title: "Proof for every removal",
    body: "Every opt-out we file is screenshotted and timestamped in your dashboard. You don't take our word for it — you see it.",
  },
  {
    title: "Only ever your data",
    body: "We confirm identity with your date of birth, address, and relatives before acting — so we remove you, never a stranger who shares your name.",
  },
];

export function Trust() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
          Trust &amp; safety
        </p>
        <h2 className="font-display" style={{ fontSize: "var(--text-section)" }}>
          Built to be trusted with the data you most want hidden.
        </h2>
      </div>

      {/* Redaction motif: exposed data getting struck out */}
      <div className="mb-12 flex flex-wrap gap-2 text-sm text-muted">
        {["123 Main St", "(415) 555‑0142", "DOB 1987", "relatives", "past addresses"].map(
          (chip) => (
            <span
              key={chip}
              className="relative rounded-md border border-line bg-ink-soft px-3 py-1.5"
            >
              <span className="opacity-40">{chip}</span>
              <span
                aria-hidden
                className="absolute inset-x-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-safe"
              />
            </span>
          ),
        )}
      </div>

      <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        {GUARANTEES.map((g) => (
          <div key={g.title} className="bg-ink-soft p-8 sm:p-9">
            <h3 className="text-lg font-semibold text-bone">{g.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{g.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
