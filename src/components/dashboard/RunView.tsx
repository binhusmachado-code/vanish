import Link from "next/link";
import { ScreenshotGallery } from "@/components/dashboard/ScreenshotGallery";
import { summarize } from "@/lib/run";
import { STATUS_META, type BrokerResult, type RunResult } from "@/lib/engine-types";

const TONE: Record<string, string> = {
  safe: "bg-safe/15 text-safe",
  amber: "bg-amber/15 text-amber",
  exposed: "bg-exposed/15 text-exposed",
  muted: "bg-line text-muted",
};

export function DashboardEmpty() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-ink-soft p-10 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line text-2xl text-muted">
        ◎
      </div>
      <h1 className="font-display text-3xl">No removals yet</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Once you authorize us, this is where you&apos;ll watch yourself
        disappear — every broker, every status, every screenshot of proof.
      </p>
      <Link
        href="/start"
        className="mt-7 inline-block rounded-full bg-safe px-7 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5"
      >
        Start my removal →
      </Link>
    </div>
  );
}

export function RunView({ run }: { run: RunResult }) {
  const { total, removed, inFlight, todos, pct } = summarize(run);
  const awaitingConfirmation = run.brokers.filter(
    (b) => b.status === "pending-verification"
  );

  return (
    <>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-safe">
            Your removal
          </p>
          <h1 className="mt-2 font-display text-4xl">{run.customerName}</h1>
          <p className="mt-2 text-sm text-muted">
            Started {new Date(run.startedAt).toLocaleDateString()}
          </p>
        </div>
        <ProgressRing pct={pct} removed={removed} total={total} />
      </div>

      <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {[
          [removed, "filed / removed", "text-safe"],
          [inFlight, "in progress", "text-amber"],
          [total, "brokers total", "text-bone"],
        ].map(([n, label, color]) => (
          <div key={label as string} className="bg-ink-soft p-6">
            <dt className={`font-display text-3xl ${color}`}>{n as number}</dt>
            <dd className="mt-1 text-sm text-muted">{label as string}</dd>
          </div>
        ))}
      </dl>

      {awaitingConfirmation.length > 0 && (
        <section className="mt-10 rounded-2xl border border-safe/30 bg-safe/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-safe">
            <span className="text-xl">📧</span>
            Check your inbox ({awaitingConfirmation.length})
          </h2>
          <p className="mt-3 text-sm text-muted">
            We submitted removal requests to these sites. They've sent confirmation emails to{" "}
            <span className="font-medium">{run.brokers[0]?.brokerId ? "your email" : "you"}</span>. Click
            the link in each email to complete the removal.
          </p>
          <ul className="mt-4 space-y-2.5">
            {awaitingConfirmation.map((b) => (
              <li
                key={b.brokerId}
                className="flex flex-col gap-1 rounded-xl border border-line bg-ink p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-medium">{b.brokerName}</span>
                </span>
                {b.expiresAt && (
                  <span className="text-xs text-safe">confirm by {b.expiresAt}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {todos.length > 0 && (
        <section className="mt-10 rounded-2xl border border-amber/30 bg-amber/5 p-6">
          <h2 className="text-lg font-semibold text-amber">
            Needs you ({todos.length})
          </h2>
          <ul className="mt-4 space-y-2.5">
            {todos.map((b) => (
              <li
                key={b.brokerId}
                className="flex flex-col gap-1 rounded-xl border border-line bg-ink p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-medium">{b.brokerName}</span>
                  {b.manualAction && (
                    <span className="ml-2 text-sm text-muted">{b.manualAction}</span>
                  )}
                </span>
                {b.expiresAt && (
                  <span className="text-xs text-amber">expires {b.expiresAt}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-5 font-display text-2xl">Every broker, every receipt</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {run.brokers.map((b) => (
            <BrokerCard key={b.brokerId} broker={b} />
          ))}
        </div>
      </section>
    </>
  );
}

function BrokerCard({ broker }: { broker: BrokerResult }) {
  const meta = STATUS_META[broker.status];
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-ink-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{broker.brokerName}</h3>
          {broker.exposed.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              Exposed: {broker.exposed.join(" · ")}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${TONE[meta.tone]}`}
        >
          {meta.label}
        </span>
      </div>
      {broker.notes && <p className="mt-3 text-sm text-muted">{broker.notes}</p>}
      <div className="mt-4">
        <ScreenshotGallery shots={broker.screenshots} />
      </div>
    </article>
  );
}

function ProgressRing({
  pct,
  removed,
  total,
}: {
  pct: number;
  removed: number;
  total: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-safe)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-safe">{pct}%</span>
        <span className="text-xs text-muted">
          {removed}/{total}
        </span>
      </div>
    </div>
  );
}
