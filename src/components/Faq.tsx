import { FAQ } from "@/lib/config";

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <h2
        className="mb-12 font-display"
        style={{ fontSize: "var(--text-section)" }}
      >
        Straight answers.
      </h2>
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              {item.q}
              <span className="text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
