import { HOW_IT_WORKS } from "@/lib/config";

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-safe">
          How it works
        </p>
        <h2 className="font-display" style={{ fontSize: "var(--text-section)" }}>
          Four steps to disappear.
        </h2>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
        {HOW_IT_WORKS.map((s) => (
          <li
            key={s.step}
            className="group bg-ink-soft p-8 transition-colors hover:bg-ink-raise sm:p-10"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-display text-5xl text-line transition-colors group-hover:text-safe">
                {s.step}
              </span>
              <h3 className="text-xl font-semibold">{s.title}</h3>
            </div>
            <p className="mt-4 leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
