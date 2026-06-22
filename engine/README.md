# VANISH removal engine

A repeatable Node CLI that files customers' **free, legal** opt-out requests with
US data brokers. It drives a **real headed Chromium browser** through each
broker's official opt-out form, best-effort auto-fills the customer's data,
screenshots every step as proof, and **pauses for a present human** to clear the
gates that block all automation (CAPTCHAs, SMS/phone codes, email-verification
links). It then writes a structured `RunResult` the VANISH dashboard reads.

This is exactly how DeleteMe / Incogni operate: software fills forms and captures
proof; a human clears the gates.

> **Scope rule:** the engine only ever acts on the **subject's own data**, and only
> after the customer's signed authorization (`authorization.agreed === true`).
> It will refuse to run otherwise.

---

## Why headed + human-in-the-loop (not full automation)

Every covered broker actively fights automation:

- They return **403** to non-browser/automated requests.
- They gate submissions behind **CAPTCHAs** (reCAPTCHA, hCaptcha, and sites that
  *stack* multiple CAPTCHAs in one session).
- They require **email-verification links** (some expire in as little as 15 min).
- **Whitepages** requires answering an **automated phone call** and entering an
  on-screen code in real time.

Full headless automation is therefore impossible *and* against their terms. The
browser does the tedious part (navigation, form-fill, screenshots); a human
clears each gate when prompted by a clearly-boxed `ACTION NEEDED` message.

---

## Setup

```bash
cd engine
npm install
npx playwright install chromium
```

- Node 26 runs `.mjs` ESM natively — **no build step, no TypeScript/tsx.**
- The only dependency is **playwright pinned to `1.60.0`** (exact, no `^`/`~`).

Verify the browser + screenshot pipeline without touching any broker:

```bash
npm run selftest
```

It launches headless, screenshots `https://example.com`, and prints `SELFTEST OK`.

---

## Doing a real removal

1. Copy `profile.example.json` to `profile.json` and fill in the customer's data.
   `authorization.agreed` **must** be `true`.
2. Run:

   ```bash
   cd engine && npm run erase -- --profile profile.json
   ```

3. A real Chrome window opens. For each broker the engine fills what it can,
   then shows an `ACTION NEEDED` box with the exact steps. **You** solve the
   CAPTCHA / open the verification email / answer the phone call, then press
   Enter and pick the outcome status.

### CLI flags

| Flag | Effect |
|---|---|
| `--profile <path>` | Customer profile JSON (default `./profile.json`). |
| `--only <id,id>` | Run just these broker ids (e.g. `--only spokeo,nuwber`). |
| `--resume` | Reuse the most recent run; skip brokers already `removed-confirmed` or `submitted`. |
| `--selftest` | Headless smoke test, no brokers. |

Broker ids: `nuwber, truepeoplesearch, usphonebook, beenverified, spokeo,
fastpeoplesearch, checkpeople, peoplefinders, mylife, radaris, whitepages,
intelius`.

---

## Output

- Per run: `../public/runs/<runId>/result.json` plus a folder per broker holding
  zero-padded proof screenshots (`01-landing.png`, `02-after-fill.png`, …).
- A copy of the latest run's full object at `../public/runs/latest.json` — this
  is what the dashboard reads.

`runId` is `YYYYMMDD-HHMMSS`. Paths are resolved from the engine location, not the
shell's cwd.

---

## What the statuses mean

| Status | Meaning |
|---|---|
| `queued` | Not started yet. |
| `in-progress` | Engine is on this broker right now. |
| `submitted` | Request sent; no further action needed from us. |
| `pending-verification` | Submitted, but the customer must click an email link / answer a call. **Has a to-do.** |
| `needs-manual` | A step the engine couldn't complete needs a human. **Has a to-do.** |
| `blocked` | Bot wall / CAPTCHA loop / page wouldn't load. Logged with the symptom; no retry-hammer. |
| `removed-confirmed` | Broker confirmed the listing is gone. |
| `not-listed` | The subject wasn't on this broker. |

After a run, the summary prints a **YOUR TO-DOS** list of every
`pending-verification` / `needs-manual` broker with its required action and link
expiry.

---

## Important realities

- **Manual gates are unavoidable.** A run needs a present operator with the
  `verificationEmail` inbox open. Intelius' link expires in ~15 minutes — have the
  inbox ready before starting that one. Whitepages needs you to answer a live
  automated phone call.
- **Networks matter.** One Intelius (PeopleConnect) suppression covers the whole
  family (TruthFinder, Instant Checkmate, US Search, ZabaSearch, Classmates, …).
  Radaris, BeenVerified, and Whitepages have sister sites that need **separate**
  opt-outs. See each playbook's `network` note.
- **Brokers re-list over time.** Removal is not permanent — **recheck in 3–6
  months** and re-run as needed.
- **Markup changes.** The playbook steps are *expected* layouts; brokers change
  their pages often. Auto-fill is best-effort and never fatal — if a field isn't
  found, the human finishes it.
