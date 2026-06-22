"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { validateCoupon, getPlan } from "@/lib/config";
import { PayPalCheckout } from "@/components/PayPalCheckout";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface AddressDraft {
  street: string;
  city: string;
  state: string;
  zip: string;
  current: boolean;
}

interface Draft {
  fullName: string;
  nameVariants: string[];
  dob: string;
  emails: string[];
  verificationEmail: string;
  phones: string[];
  addresses: AddressDraft[];
  relatives: string[];
  signedName: string;
  agreed: boolean;
  couponCode: string;
  couponLabel: string | null;
}

const STEPS = [
  { key: "identity", label: "Identity", hint: "Who we're removing" },
  { key: "addresses", label: "Where you've lived", hint: "Brokers index old addresses" },
  { key: "contact", label: "Contact", hint: "Emails & phones to scrub" },
  { key: "relatives", label: "Relatives", hint: "For matching only" },
  { key: "authorize", label: "Authorize", hint: "Your legal sign-off" },
] as const;

const emptyAddress: AddressDraft = {
  street: "",
  city: "",
  state: "",
  zip: "",
  current: true,
};

export function StartFlow() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    fullName: "",
    nameVariants: [],
    dob: "",
    emails: [""],
    verificationEmail: "",
    phones: [""],
    addresses: [{ ...emptyAddress }],
    relatives: [],
    signedName: "",
    agreed: false,
    couponCode: "",
    couponLabel: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [plan, setPlan] = useState("pro");
  const [payCtx, setPayCtx] = useState<{ profileId: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Read the chosen plan from ?plan= (defaults to Pro). Client-only to avoid
  // a Suspense boundary on this static route.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p) setPlan(p);
  }, []);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!draft.fullName.trim()) return "Enter your full legal name.";
      if (!draft.dob.trim()) return "Enter your date of birth.";
    }
    if (step === 1) {
      const a = draft.addresses[0];
      if (!a.street.trim() || !a.city.trim() || !a.state.trim())
        return "Enter at least your current street, city, and state.";
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.verificationEmail.trim()))
        return "Enter a valid verification email — brokers send confirmation links there.";
    }
    if (step === 4) {
      if (!draft.agreed) return "You must authorize us to act on your behalf.";
      if (draft.signedName.trim().length < 2)
        return "Type your full name to sign.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: draft.fullName,
          nameVariants: draft.nameVariants,
          dob: draft.dob,
          emails: draft.emails,
          verificationEmail: draft.verificationEmail,
          phones: draft.phones,
          addresses: draft.addresses,
          relatives: draft.relatives,
          authorization: { agreed: draft.agreed, signedName: draft.signedName },
          couponCode: draft.couponLabel ? draft.couponCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      setToken(data.token ?? null);

      // Founder comp (100%-off coupon) → done, no payment.
      if (draft.couponLabel) {
        setDone(true);
        return;
      }

      // Otherwise move to the payment step.
      setPayCtx({ profileId: data.profileId });
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const dashHref = token ? `/dashboard/${token}` : "/dashboard";

  if (done) return <SuccessPanel name={draft.fullName} dashHref={dashHref} />;

  if (payCtx)
    return (
      <PaymentStep
        plan={plan}
        profileId={payCtx.profileId}
        email={draft.verificationEmail}
        token={token}
        couponCode={draft.couponLabel ? draft.couponCode : undefined}
        onSuccess={() => setDone(true)}
        onBack={() => setPayCtx(null)}
      />
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      {/* Step rail */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const state =
              i === step ? "current" : i < step ? "done" : "todo";
            return (
              <li key={s.key}>
                <div
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                    state === "current" ? "bg-ink-soft" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      state === "done"
                        ? "bg-safe text-ink"
                        : state === "current"
                          ? "border border-safe text-safe"
                          : "border border-line text-muted"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <div>
                    <p
                      className={
                        state === "todo" ? "text-muted" : "text-bone"
                      }
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-muted">{s.hint}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 px-3 text-xs leading-relaxed text-muted">
          Your information is encrypted and used only to file your removals. We
          never sell it.
        </p>
      </aside>

      {/* Active step */}
      <div className="rounded-2xl border border-line bg-ink-soft p-7 sm:p-9">
        <p className="text-sm uppercase tracking-[0.2em] text-safe">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 font-display text-3xl">{STEPS[step].label}</h2>

        <div className="mt-7">
          {step === 0 && <IdentityStep draft={draft} set={set} />}
          {step === 1 && <AddressStep draft={draft} set={set} />}
          {step === 2 && <ContactStep draft={draft} set={set} />}
          {step === 3 && <RelativesStep draft={draft} set={set} />}
          {step === 4 && <AuthorizeStep draft={draft} set={set} />}
        </div>

        {error && <p className="mt-5 text-sm text-exposed">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="rounded-full px-5 py-2.5 text-sm text-muted transition-colors hover:text-bone disabled:invisible"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="rounded-full bg-bone px-7 py-3 font-medium text-ink transition-transform hover:-translate-y-0.5"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-full bg-safe px-7 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting
                ? "Authorizing…"
                : draft.couponLabel
                  ? "Authorize & start my removal"
                  : "Authorize & continue to payment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Steps ─── */

interface StepProps {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}

function IdentityStep({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <Text
        label="Full legal name"
        value={draft.fullName}
        onChange={(v) => set("fullName", v)}
        placeholder="Jane Q. Public"
      />
      <ListField
        label="Other names you've used"
        hint="Maiden / former names, nicknames, common misspellings. Brokers index each separately."
        values={draft.nameVariants}
        onChange={(v) => set("nameVariants", v)}
        placeholder="e.g. Jane Smith"
      />
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Date of birth</span>
        <input
          type="date"
          value={draft.dob}
          onChange={(e) => set("dob", e.target.value)}
          className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none focus:border-safe"
        />
        <span className="mt-1.5 block text-xs text-muted">
          This is the strongest way to tell you apart from people with your name.
        </span>
      </label>
    </div>
  );
}

function AddressStep({ draft, set }: StepProps) {
  function update(i: number, patch: Partial<AddressDraft>) {
    set(
      "addresses",
      draft.addresses.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    );
  }
  return (
    <div className="space-y-6">
      {draft.addresses.map((a, i) => (
        <div key={i} className="rounded-xl border border-line bg-ink p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted">
              {i === 0 ? "Current address" : `Previous address ${i}`}
            </span>
            {i > 0 && (
              <button
                onClick={() =>
                  set(
                    "addresses",
                    draft.addresses.filter((_, idx) => idx !== i),
                  )
                }
                className="text-xs text-exposed hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <div className="space-y-3">
            <Text
              label="Street"
              value={a.street}
              onChange={(v) => update(i, { street: v })}
              placeholder="123 Main St"
            />
            <div className="grid grid-cols-2 gap-3">
              <Text
                label="City"
                value={a.city}
                onChange={(v) => update(i, { city: v })}
              />
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">State</span>
                <select
                  value={a.state}
                  onChange={(e) => update(i, { state: e.target.value })}
                  className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none focus:border-safe"
                >
                  <option value="">—</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Text
              label="ZIP"
              value={a.zip}
              onChange={(v) => update(i, { zip: v })}
              placeholder="94105"
            />
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          set("addresses", [
            ...draft.addresses,
            { ...emptyAddress, current: false },
          ])
        }
        className="rounded-full border border-line px-5 py-2.5 text-sm text-bone transition-colors hover:bg-ink-raise"
      >
        + Add a previous address
      </button>
    </div>
  );
}

function ContactStep({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">
          Verification email (you can check this now)
        </span>
        <input
          type="email"
          value={draft.verificationEmail}
          onChange={(e) => set("verificationEmail", e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none placeholder:text-muted/50 focus:border-safe"
        />
        <span className="mt-1.5 block text-xs text-muted">
          Brokers send confirmation links here to finalize each removal.
        </span>
      </label>
      <ListField
        label="Email addresses to scrub"
        hint="Any emails that show up in your listings."
        values={draft.emails}
        onChange={(v) => set("emails", v)}
        placeholder="old@email.com"
      />
      <ListField
        label="Phone numbers"
        hint="Cell and landline."
        values={draft.phones}
        onChange={(v) => set("phones", v)}
        placeholder="(415) 555‑0142"
      />
    </div>
  );
}

function RelativesStep({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-ink p-4 text-sm text-muted">
        We use relatives&apos; first names <strong className="text-bone">only to confirm a
        listing is really you</strong> — namesakes are common. They are never a
        target and never removed.
      </div>
      <ListField
        label="Relatives' first names"
        hint="Parents, siblings, spouse — first names are enough."
        values={draft.relatives}
        onChange={(v) => set("relatives", v)}
        placeholder="e.g. Robert"
      />
    </div>
  );
}

function AuthorizeStep({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-ink p-4 text-sm leading-relaxed text-muted">
        <p className="mb-2 font-medium text-bone">Authorization to act as your agent</p>
        <p>
          I authorize VANISH to act as my authorized agent to request the
          deletion of, and to opt out of the sale and sharing of, my personal
          information held by data brokers and people-search websites, as
          permitted under applicable US privacy law (including the CCPA). I
          confirm the information I&apos;ve provided is my own and accurate, and
          that VANISH may submit removal and suppression requests on my behalf.
          This authorization remains in effect for the duration of my
          subscription and may be revoked at any time.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.agreed}
          onChange={(e) => set("agreed", e.target.checked)}
          className="mt-1 h-4 w-4 accent-[oklch(80%_0.16_158)]"
        />
        <span className="text-muted">
          I have read and agree to the authorization above and to the{" "}
          <Link href="/terms" className="text-safe hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-safe hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <Text
        label="Type your full name to sign"
        value={draft.signedName}
        onChange={(v) => set("signedName", v)}
        placeholder="Jane Q. Public"
      />

      <CouponField draft={draft} set={set} />
    </div>
  );
}

function CouponField({ draft, set }: StepProps) {
  const [code, setCode] = useState(draft.couponCode);
  const [err, setErr] = useState<string | null>(null);

  function apply() {
    const match = validateCoupon(code);
    if (!match) {
      setErr("That code isn't valid.");
      set("couponLabel", null);
      return;
    }
    setErr(null);
    set("couponCode", code.trim().toUpperCase());
    set("couponLabel", match.label);
  }

  if (draft.couponLabel) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-safe/40 bg-safe/10 px-4 py-3 text-sm">
        <span className="text-safe">✓ {draft.couponLabel} applied</span>
        <button
          onClick={() => {
            set("couponLabel", null);
            set("couponCode", "");
            setCode("");
          }}
          className="text-xs text-muted hover:text-bone"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <span className="mb-1.5 block text-muted">Coupon code (optional)</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="FOUNDER-FREE"
          className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 uppercase text-bone outline-none placeholder:text-muted/40 focus:border-safe"
        />
        <button
          onClick={apply}
          className="shrink-0 rounded-lg border border-line px-5 text-bone transition-colors hover:bg-ink-raise"
        >
          Apply
        </button>
      </div>
      {err && <p className="mt-1.5 text-xs text-exposed">{err}</p>}
    </div>
  );
}

function PaymentStep({
  plan,
  profileId,
  email,
  token,
  couponCode,
  onSuccess,
  onBack,
}: {
  plan: string;
  profileId: string;
  email: string;
  token: string | null;
  couponCode?: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const selected = getPlan(plan) ?? getPlan("pro")!;
  const [redirecting, setRedirecting] = useState(false);
  const [cardErr, setCardErr] = useState<string | null>(null);

  async function payWithCard() {
    setRedirecting(true);
    setCardErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, email, profileId, token, couponCode }),
      });
      const d = await res.json();
      if (!res.ok) {
        setCardErr(d.error ?? "Could not start card checkout.");
        setRedirecting(false);
        return;
      }
      if (d.free) {
        onSuccess();
        return;
      }
      if (d.url) {
        window.location.href = d.url;
        return;
      }
      setCardErr("Could not start card checkout.");
      setRedirecting(false);
    } catch {
      setCardErr("Network error. Please try again.");
      setRedirecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-ink-soft p-7 sm:p-9">
      <p className="text-sm uppercase tracking-[0.2em] text-safe">
        Last step — payment
      </p>
      <h2 className="mt-2 font-display text-3xl">Confirm your plan</h2>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-ink p-5">
        <div>
          <p className="font-semibold">{selected.name}</p>
          <p className="text-sm text-muted">{selected.blurb}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl">${selected.priceYearly}</p>
          <p className="text-xs text-muted">/year</p>
        </div>
      </div>

      {/* Pay with card (Stripe) */}
      <button
        onClick={payWithCard}
        disabled={redirecting}
        className="mt-6 w-full rounded-full bg-safe px-6 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {redirecting ? "Redirecting…" : "Pay with card"}
      </button>
      {cardErr && <p className="mt-3 text-sm text-exposed">{cardErr}</p>}

      {/* Divider */}
      <div className="my-6 flex items-center gap-4 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Pay with PayPal */}
      <PayPalCheckout
        planId={plan}
        profileId={profileId}
        token={token}
        couponCode={couponCode}
        onSuccess={onSuccess}
      />

      <button
        onClick={onBack}
        className="mt-6 text-sm text-muted transition-colors hover:text-bone"
      >
        ← Back to my details
      </button>
      <p className="mt-4 text-xs text-muted">
        Secure checkout by Stripe or PayPal. Cancel anytime. Removal is ongoing
        for as long as you&apos;re subscribed.
      </p>
    </div>
  );
}

function SuccessPanel({ name, dashHref }: { name: string; dashHref: string }) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return (
    <div className="rise mx-auto max-w-xl rounded-2xl border border-safe/40 bg-ink-soft p-9 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-safe/15 text-2xl text-safe">
        ✓
      </div>
      <h2 className="font-display text-3xl">You&apos;re authorized, {first}.</h2>
      <p className="mt-4 leading-relaxed text-muted">
        Your removal is queued. We&apos;re filing your opt-outs across the data
        brokers now — every one captured with a screenshot. Watch it happen live.
      </p>
      <Link
        href={dashHref}
        className="mt-7 inline-block rounded-full bg-safe px-7 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5"
      >
        Go to my dashboard →
      </Link>
    </div>
  );
}

/* ─── Reusable inputs ─── */

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none placeholder:text-muted/50 focus:border-safe"
      />
    </label>
  );
}

function ListField({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const rows = values.length > 0 ? values : [""];
  function update(i: number, v: string) {
    const next = [...rows];
    next[i] = v;
    onChange(next);
  }
  return (
    <div className="text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <div className="space-y-2">
        {rows.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-bone outline-none placeholder:text-muted/50 focus:border-safe"
            />
            {rows.length > 1 && (
              <button
                onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                aria-label="Remove"
                className="shrink-0 rounded-lg border border-line px-3 text-muted hover:text-exposed"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...rows, ""])}
        className="mt-2 text-xs text-safe hover:underline"
      >
        + Add another
      </button>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
