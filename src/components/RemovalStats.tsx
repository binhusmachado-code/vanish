export function RemovalStats() {
  const stats = [
    {
      number: "484+",
      label: "Data brokers targeted",
      desc: "Acxiom, TruthFinder, Spokeo, Pipl, and more",
    },
    {
      number: "311",
      label: "Removal requests submitted",
      desc: "Automated form fills + submissions",
    },
    {
      number: "39",
      label: "Awaiting email confirmation",
      desc: "We track and reminder you to confirm",
    },
    {
      number: "100%",
      label: "Of major US brokers",
      desc: "Consumer reports, people search, data aggregators",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="mb-16 max-w-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
          Coverage
        </p>
        <h2
          className="font-display"
          style={{ fontSize: "var(--text-section)" }}
        >
          Your data, removed from everywhere.
        </h2>
        <p className="mt-4 text-muted">
          One submission removes you from 300+ data broker networks. No manual
          forms. No waiting.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-3xl font-bold text-safe">{stat.number}</div>
            <div className="mt-2 font-semibold text-ink">{stat.label}</div>
            <p className="mt-1 text-sm text-muted">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-line bg-ink-soft p-8">
        <h3 className="font-display" style={{ fontSize: "var(--text-base)" }}>
          How it works
        </h3>
        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-safe font-semibold text-ink">
              1
            </div>
            <div>
              <div className="font-semibold">Automated submission</div>
              <p className="text-sm text-muted">
                We fill out removal forms on 300+ sites and submit them for you.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-safe font-semibold text-ink">
              2
            </div>
            <div>
              <div className="font-semibold">Email confirmations</div>
              <p className="text-sm text-muted">
                Some sites send confirmation emails. We track those for you.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-safe font-semibold text-ink">
              3
            </div>
            <div>
              <div className="font-semibold">Verification & reporting</div>
              <p className="text-sm text-muted">
                Track progress in your dashboard. See which sites removed you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
