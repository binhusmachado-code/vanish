/**
 * The differentiator: screenshot proof of every removal.
 * Renders a faux "removal log" — replaced with real engine screenshots
 * in the customer dashboard once the engine runs.
 */
const SAMPLE_LOG = [
  { broker: "Spokeo", status: "removed", when: "2 days ago" },
  { broker: "Whitepages", status: "removed", when: "2 days ago" },
  { broker: "BeenVerified", status: "removed", when: "3 days ago" },
  { broker: "Radaris", status: "pending", when: "in queue" },
  { broker: "MyLife", status: "removed", when: "4 days ago" },
  { broker: "TruePeopleSearch", status: "removed", when: "5 days ago" },
];

export function Proof() {
  return (
    <section id="proof" className="border-y border-line bg-ink-soft/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
            Proof, not promises
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "var(--text-section)" }}
          >
            We screenshot every single removal.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            Most services just tell you it&apos;s &ldquo;handled.&rdquo; We show
            you. Every opt-out we file is captured and dropped into your
            dashboard — so you can watch yourself vanish, broker by broker.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-ink p-2 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-exposed/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-safe/70" />
            <span className="ml-3 text-xs text-muted">your removal log</span>
          </div>
          <ul className="divide-y divide-line rounded-xl bg-ink-soft">
            {SAMPLE_LOG.map((row) => (
              <li
                key={row.broker}
                className="flex items-center justify-between px-5 py-4"
              >
                <span className="font-medium">{row.broker}</span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-muted">{row.when}</span>
                  {row.status === "removed" ? (
                    <span className="rounded-full bg-safe/15 px-3 py-1 text-xs font-medium text-safe">
                      ✓ removed
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber/15 px-3 py-1 text-xs font-medium text-amber">
                      ⋯ pending
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
