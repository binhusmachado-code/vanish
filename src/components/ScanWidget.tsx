"use client";

import { useState } from "react";
import Link from "next/link";
import { COVERAGE } from "@/lib/config";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface BrokerHit {
  name: string;
  domain: string;
  tier: string;
}
interface ScanResult {
  name: string;
  exposedCount: number;
  totalCovered: number;
  brokers: BrokerHit[];
}

type Phase = "form" | "scanning" | "result";

export function ScanWidget() {
  const [phase, setPhase] = useState<Phase>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("scanning");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, state, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setPhase("form");
        return;
      }
      // Brief dramatic pause so the scan feels real.
      await new Promise((r) => setTimeout(r, 1600));
      setResult(data);
      setPhase("result");
    } catch {
      setError("Network error. Please try again.");
      setPhase("form");
    }
  }

  if (phase === "result" && result) {
    return (
      <div className="rise rounded-2xl border border-line bg-ink-soft p-7 sm:p-9">
        <p className="text-sm uppercase tracking-[0.2em] text-exposed">
          Exposure report
        </p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">
          {result.name}, you&apos;re exposed on{" "}
          <span className="text-exposed">{result.exposedCount}+</span> sites.
        </h2>
        <p className="mt-3 text-muted">
          These data brokers publicly list and sell information about people like
          you. Subscribe and we&apos;ll start removing you from every one —
          screenshotting the proof.
        </p>

        <ul className="mt-6 grid max-h-72 grid-cols-1 gap-px overflow-y-auto rounded-xl border border-line bg-line sm:grid-cols-2">
          {result.brokers.map((b) => (
            <li
              key={b.domain}
              className="flex items-center justify-between bg-ink p-3.5 text-sm"
            >
              <span>{b.name}</span>
              <span className="rounded-full bg-exposed/15 px-2.5 py-0.5 text-xs text-exposed">
                listed
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/pricing"
          className="mt-7 block rounded-full bg-safe px-6 py-4 text-center font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          Remove me from all {result.exposedCount}+ sites →
        </Link>
        <p className="mt-3 text-center text-xs text-muted">
          Plans from $8.25/mo · cancel anytime
        </p>
      </div>
    );
  }

  if (phase === "scanning") {
    return (
      <div className="rounded-2xl border border-line bg-ink-soft p-12 text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-safe" />
        <p className="font-display text-2xl">Scanning the brokers…</p>
        <p className="mt-2 text-sm text-muted">
          Checking {COVERAGE.brokerCount}+ data brokers for your information.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-ink-soft p-7 sm:p-9"
    >
      <h2 className="font-display text-2xl">Run your free exposure scan</h2>
      <p className="mt-2 text-sm text-muted">
        See which data brokers are selling your information. Takes under a minute.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          value={firstName}
          onChange={setFirstName}
          autoComplete="given-name"
        />
        <Field
          label="Last name"
          value={lastName}
          onChange={setLastName}
          autoComplete="family-name"
        />
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block text-muted">State</span>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none focus:border-safe"
        >
          <option value="">Select your state…</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block text-muted">Email (to send your report)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none placeholder:text-muted/50 focus:border-safe"
        />
      </label>

      {error && <p className="mt-4 text-sm text-exposed">{error}</p>}

      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-safe px-6 py-4 font-semibold text-ink transition-transform hover:-translate-y-0.5"
      >
        Scan for my exposed data
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Free · no credit card · we never sell your data
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none focus:border-safe"
      />
    </label>
  );
}
