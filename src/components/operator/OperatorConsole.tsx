"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_META, type RemovalStatus } from "@/lib/engine-types";
import type { CustomerRow } from "@/lib/customers";

const TONE: Record<string, string> = {
  safe: "bg-safe/15 text-safe",
  amber: "bg-amber/15 text-amber",
  exposed: "bg-exposed/15 text-exposed",
  muted: "bg-line text-muted",
};

const ACTIONS: { status: RemovalStatus; label: string; cls: string }[] = [
  { status: "removed-confirmed", label: "✓ Removed", cls: "border-safe/50 text-safe hover:bg-safe/10" },
  { status: "needs-manual", label: "Needs me", cls: "border-amber/50 text-amber hover:bg-amber/10" },
  { status: "blocked", label: "Blocked", cls: "border-exposed/50 text-exposed hover:bg-exposed/10" },
];

export function OperatorConsole({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  async function mark(token: string, brokerId: string, status: RemovalStatus) {
    const key = `${token}:${brokerId}`;
    setPending((p) => new Set(p).add(key));
    setNote(null);
    try {
      const res = await fetch("/api/admin/removal-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, brokerId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error ?? "Update failed.");
      } else if (data.emailed) {
        setNote(`Updated ${data.broker} → ${status}. Customer emailed. ✓`);
      } else {
        setNote(`Updated ${data.broker} → ${status}.`);
      }
      router.refresh();
    } catch {
      setNote("Network error.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    }
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-ink-soft p-10 text-center text-muted">
        No customers yet. They&apos;ll appear here the moment someone signs up.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {note && (
        <div className="sticky top-20 z-20 rounded-xl border border-safe/40 bg-ink-raise px-4 py-3 text-sm text-bone shadow-lg">
          {note}
        </div>
      )}

      {customers.map((c) => (
        <details
          key={c.token}
          className="group overflow-hidden rounded-2xl border border-line bg-ink-soft"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="truncate text-sm text-muted">{c.email}</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="font-display text-xl text-safe">{c.progress.pct}%</p>
                <p className="text-xs text-muted">
                  {c.progress.removed}/{c.progress.total} done
                </p>
              </div>
              {c.progress.todos > 0 && (
                <span className="rounded-full bg-amber/15 px-2.5 py-1 text-xs text-amber">
                  {c.progress.todos} need you
                </span>
              )}
              <span className="text-muted transition-transform group-open:rotate-90">
                ›
              </span>
            </div>
          </summary>

          <div className="border-t border-line">
            {/* progress bar */}
            <div className="h-1 w-full bg-line">
              <div
                className="h-full bg-safe"
                style={{ width: `${c.progress.pct}%` }}
              />
            </div>

            <a
              href={`/dashboard/${c.token}`}
              target="_blank"
              rel="noreferrer"
              className="block px-5 pt-4 text-xs text-muted hover:text-safe"
            >
              Open customer&apos;s dashboard ↗
            </a>

            <ul className="divide-y divide-line p-3">
              {(c.run?.brokers ?? []).map((b) => {
                const meta = STATUS_META[b.status];
                const key = `${c.token}:${b.brokerId}`;
                const busy = pending.has(key);
                return (
                  <li
                    key={b.brokerId}
                    className="flex flex-wrap items-center justify-between gap-3 px-2 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{b.brokerName}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs ${TONE[meta.tone]}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {ACTIONS.map((a) => (
                        <button
                          key={a.status}
                          disabled={busy || b.status === a.status}
                          onClick={() => mark(c.token, b.brokerId, a.status)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-40 ${a.cls}`}
                        >
                          {busy ? "…" : a.label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}
