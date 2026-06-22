#!/usr/bin/env node
/**
 * VANISH removal engine — orchestrator.
 *
 * Drives a real (headed) Chromium browser through each broker's free opt-out
 * form, best-effort auto-fills the customer's data, screenshots every step as
 * proof, and PAUSES for human-only gates (CAPTCHA / SMS / email links / phone
 * calls). Writes a structured RunResult the Next.js dashboard reads.
 *
 * Usage:
 *   node src/run.mjs                         # real run, ./profile.json
 *   node src/run.mjs --profile path.json     # real run, explicit profile
 *   node src/run.mjs --only spokeo,nuwber    # subset of brokers
 *   node src/run.mjs --resume                # reuse latest run, skip done ones
 *   node src/run.mjs --selftest              # headless smoke test, no brokers
 *
 * This is exactly how DeleteMe-style services operate: the browser fills forms
 * + screenshots; a present human clears the gates that block all automation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PLAYBOOKS } from "../playbooks.mjs";
import { launch, screenshot, NAV_TIMEOUT_MS, resetScreenshotCounters } from "./browser.mjs";
import { ask, pause, paint, c } from "./prompt.mjs";
import { OUTCOME_STATUSES } from "./types.mjs";

// repoRoot: engine/src/run.mjs -> up two levels = vanish/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENGINE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(ENGINE_ROOT, "..");
const RUNS_ROOT = path.join(REPO_ROOT, "public", "runs");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    profile: "./profile.json",
    resume: false,
    only: /** @type {string[]|null} */ (null),
    selftest: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--selftest") args.selftest = true;
    else if (a === "--resume") args.resume = true;
    else if (a === "--profile") args.profile = argv[++i] ?? args.profile;
    else if (a === "--only") {
      const v = argv[++i] ?? "";
      args.only = v
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Banner / logging
// ---------------------------------------------------------------------------
function banner() {
  const title = "V A N I S H   ·   removal engine";
  process.stdout.write("\n");
  process.stdout.write(paint(c.bold + c.magenta, `  ${title}\n`));
  process.stdout.write(
    paint(c.gray, "  Files legal opt-out requests with US data brokers.\n")
  );
  process.stdout.write(
    paint(
      c.bold + c.cyan,
      "\n  SCOPE: Only ever acts on the subject's OWN data.\n"
    )
  );
  process.stdout.write(
    paint(
      c.cyan,
      "  Confirm identity (DOB / address / relative) before removing.\n\n"
    )
  );
}

function logStep(text) {
  process.stdout.write(paint(c.gray, `    ${text}\n`));
}

// ---------------------------------------------------------------------------
// Profile loading + validation
// ---------------------------------------------------------------------------
/**
 * @param {string} profilePath
 * @returns {import('./types.mjs').CustomerProfile}
 */
function loadProfile(profilePath) {
  const resolved = path.isAbsolute(profilePath)
    ? profilePath
    : path.resolve(process.cwd(), profilePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Profile not found: ${resolved}`);
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(resolved, "utf8"));
  } catch (err) {
    throw new Error(`Profile is not valid JSON: ${err instanceof Error ? err.message : err}`);
  }
  return raw;
}

/**
 * Validate the profile. Returns a list of human-readable problems (empty = OK).
 * @param {any} p
 * @returns {string[]}
 */
function validateProfile(p) {
  const problems = [];
  if (!p || typeof p !== "object") return ["Profile is empty or not an object."];
  if (!p.fullName || typeof p.fullName !== "string") problems.push("Missing fullName.");
  if (!p.dob || typeof p.dob !== "string") problems.push("Missing dob (YYYY-MM-DD).");
  if (!Array.isArray(p.addresses) || p.addresses.length === 0)
    problems.push("Need at least one address.");
  if (!p.verificationEmail || typeof p.verificationEmail !== "string")
    problems.push("Missing verificationEmail (an inbox you can check now).");
  if (!p.authorization || p.authorization.agreed !== true)
    problems.push("authorization.agreed must be true — REFUSING to act without the customer's signed authorization (CCPA agent consent).");
  return problems;
}

// ---------------------------------------------------------------------------
// Field derivation from profile
// ---------------------------------------------------------------------------
/**
 * @param {import('./types.mjs').CustomerProfile} p
 */
function deriveFields(p) {
  const current = (p.addresses || []).find((a) => a && a.current) || (p.addresses || [])[0] || {};
  const nameParts = String(p.fullName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  return {
    fullName: p.fullName || "",
    firstName,
    lastName,
    email: p.verificationEmail || (p.emails || [])[0] || "",
    phone: (p.phones || [])[0] || "",
    city: current.city || "",
    state: current.state || "",
    zip: current.zip || "",
    street: current.street || "",
    dob: p.dob || "",
  };
}

// ---------------------------------------------------------------------------
// Best-effort generic auto-fill
// ---------------------------------------------------------------------------
/**
 * Try to fill a logical field by matching name/id/placeholder/aria/label,
 * case-insensitively, across several strategies. Never throws.
 *
 * `seen` is a set of already-filled input fingerprints so an earlier broad
 * attempt (e.g. "name" matching a first-name box) doesn't get clobbered by a
 * later one — and so a later attempt skips an input a prior pass already used.
 *
 * @param {import('playwright').Page} page
 * @param {string[]} patterns   substrings to match against attributes (lowercased)
 * @param {string} value
 * @param {Set<string>} seen    fingerprints (name|id) of inputs already filled
 * @returns {Promise<boolean>} whether something was filled
 */
async function tryFill(page, patterns, value, seen) {
  if (!value) return false;
  /** @type {string[]} */
  const attrSelectors = [];
  for (const p of patterns) {
    attrSelectors.push(`input[name*="${p}" i]`);
    attrSelectors.push(`input[id*="${p}" i]`);
    attrSelectors.push(`input[placeholder*="${p}" i]`);
    attrSelectors.push(`input[aria-label*="${p}" i]`);
    attrSelectors.push(`textarea[name*="${p}" i]`);
  }

  /**
   * Fill a located element unless we already filled it. Records its fingerprint.
   * @param {import('playwright').Locator} loc
   */
  async function fillIfFresh(loc) {
    const name = (await loc.getAttribute("name").catch(() => null)) || "";
    const id = (await loc.getAttribute("id").catch(() => null)) || "";
    const fp = `${name}|${id}`;
    if (fp !== "|" && seen.has(fp)) return false; // already used this exact input
    await loc.fill(value, { timeout: 4000 });
    if (fp !== "|") seen.add(fp);
    return true;
  }

  // Strategy 1: attribute match.
  for (const sel of attrSelectors) {
    try {
      const loc = page.locator(sel).first();
      const count = await loc.count();
      if (count > 0 && (await loc.isVisible().catch(() => false))) {
        if (await fillIfFresh(loc)) return true;
      }
    } catch {
      /* try next */
    }
  }
  // Strategy 2: associated <label> text.
  for (const p of patterns) {
    try {
      const loc = page.getByLabel(new RegExp(p, "i")).first();
      if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) {
        if (await fillIfFresh(loc)) return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

/**
 * Best-effort fill of all common fields. Records what it managed to fill.
 * Designed to never crash the run — missing fields are simply skipped.
 *
 * @param {import('playwright').Page} page
 * @param {ReturnType<typeof deriveFields>} f
 * @returns {Promise<string[]>} labels of fields successfully filled
 */
async function autoFill(page, f) {
  const filled = [];
  /** Shared fingerprint set so passes don't clobber each other's inputs. */
  const seen = new Set();
  // Order matters: specific first/last BEFORE the generic full-name fallback,
  // and the full-name patterns are tight (fullname/full-name/full_name) so they
  // don't grab a first-name box that merely contains "name".
  const attempts = [
    ["email", ["email", "e-mail"], f.email],
    ["first name", ["firstname", "first-name", "first_name", "fname", "given"], f.firstName],
    ["last name", ["lastname", "last-name", "last_name", "lname", "surname", "family"], f.lastName],
    ["full name", ["fullname", "full-name", "full_name", "full name"], f.fullName],
    ["city", ["city", "town"], f.city],
    ["state", ["state", "region", "province"], f.state],
    ["zip", ["zip", "postal", "postcode"], f.zip],
    ["phone", ["phone", "tel", "mobile"], f.phone],
  ];
  for (const [label, patterns, value] of attempts) {
    try {
      const ok = await tryFill(page, patterns, value, seen);
      if (ok) filled.push(label);
    } catch {
      /* skip — never let one field kill the fill */
    }
  }
  return filled;
}

// ---------------------------------------------------------------------------
// Manual-gate instruction builder
// ---------------------------------------------------------------------------
/**
 * Build the exact human instructions for a broker's gate from its playbook.
 * @param {import('../playbooks.mjs').Playbook} pb
 * @param {ReturnType<typeof deriveFields>} f
 */
function gateInstructions(pb, f) {
  const lines = [];
  lines.push(`${pb.name} — finish the opt-out in the browser window.`);
  lines.push("");
  lines.push("Procedure:");
  pb.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
  lines.push("");

  // Verification / CAPTCHA specifics.
  const verNote = {
    email: "Verification: open the confirmation EMAIL and click the link.",
    "phone-call": "Verification: ANSWER the automated PHONE CALL and key in the on-screen code (only you can do this).",
    "captcha+email": "Verification: solve the CAPTCHA, then open the confirmation EMAIL and click the link.",
    "email+second-code": "Verification: click the email link FAST, then enter the SECOND code (email or phone).",
  }[pb.verification];
  if (verNote) lines.push(verNote);

  const capNote = {
    none: "",
    checkbox: "CAPTCHA: tick the 'I am human' checkbox.",
    recaptcha: "CAPTCHA: solve the reCAPTCHA.",
    hcaptcha: "CAPTCHA: solve the hCaptcha (it appears TWICE on this site).",
    stacking: "CAPTCHA: this site STACKS CAPTCHAs — expect several in a row.",
    "two-gates": "CAPTCHA: TWO separate CAPTCHA gates (one before the email link, one after).",
  }[pb.captcha];
  if (capNote) lines.push(capNote);

  if (pb.expiryWindow) lines.push(paintless(`Time-box: ${pb.expiryWindow}.`));
  lines.push("");
  lines.push(`Customer data to paste if asked:`);
  lines.push(`  name=${f.fullName || "—"}  email=${f.email || "—"}`);
  if (f.city || f.state) lines.push(`  city=${f.city || "—"}  state=${f.state || "—"}`);
  if (f.phone) lines.push(`  phone=${f.phone}`);
  if (pb.requiredFields.includes("dob") && f.dob) lines.push(`  dob=${f.dob}`);
  if (pb.requiredFields.includes("profileUrl"))
    lines.push("  profileUrl=(find your listing first and paste its URL)");
  return lines.join("\n");
}

// pause() does its own coloring; keep instruction text plain.
function paintless(s) {
  return s;
}

// ---------------------------------------------------------------------------
// Per-broker driver
// ---------------------------------------------------------------------------
/**
 * @param {import('playwright').BrowserContext} context
 * @param {import('../playbooks.mjs').Playbook} pb
 * @param {ReturnType<typeof deriveFields>} f
 * @param {string} runDir
 * @param {string} runId
 * @param {number} index
 * @param {number} total
 * @returns {Promise<import('./types.mjs').BrokerResult>}
 */
async function processBroker(context, pb, f, runDir, runId, index, total) {
  /** @type {import('./types.mjs').BrokerResult} */
  const result = {
    brokerId: pb.id,
    brokerName: pb.name,
    listed: "unknown",
    exposed: [],
    profileUrls: [],
    status: "in-progress",
    screenshots: [],
    startedAt: new Date().toISOString(),
    notes: "",
  };

  process.stdout.write(
    "\n" +
      paint(c.bold + c.blue, `[${index + 1}/${total}] ${pb.name}`) +
      paint(c.gray, `  (${pb.id})\n`)
  );

  const page = await context.newPage();
  try {
    // --- Navigate (max 2 attempts, no hammering) ---
    let loaded = false;
    let lastErr = "";
    for (let attempt = 1; attempt <= 2 && !loaded; attempt++) {
      try {
        logStep(`Opening ${pb.optOutUrl} (attempt ${attempt}/2)…`);
        const resp = await page.goto(pb.optOutUrl, {
          waitUntil: "domcontentloaded",
          timeout: NAV_TIMEOUT_MS,
        });
        const sc = resp ? resp.status() : 0;
        if (sc >= 400) {
          lastErr = `HTTP ${sc} — likely a bot wall.`;
          logStep(paint(c.yellow, `  Got ${lastErr}`));
          // One retry only, then bail to blocked.
          continue;
        }
        loaded = true;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        logStep(paint(c.yellow, `  Navigation problem: ${lastErr}`));
      }
    }

    if (!loaded) {
      const shot = await screenshot(page, runDir, runId, pb.id, "blocked");
      if (shot) result.screenshots.push(shot);
      result.status = "blocked";
      result.notes = `Page would not load: ${lastErr}`;
      result.finishedAt = new Date().toISOString();
      logStep(paint(c.red, "  BLOCKED — page would not load. Skipping (no retry-hammer)."));
      return result;
    }

    // --- Screenshot landing ---
    const landing = await screenshot(page, runDir, runId, pb.id, "landing");
    if (landing) result.screenshots.push(landing);

    // --- Best-effort auto-fill ---
    logStep("Auto-filling form fields (best effort)…");
    let filled = [];
    try {
      filled = await autoFill(page, f);
    } catch (err) {
      logStep(paint(c.yellow, `  Auto-fill skipped: ${err instanceof Error ? err.message : err}`));
    }
    if (filled.length) {
      logStep(paint(c.green, `  Filled: ${filled.join(", ")}`));
    } else {
      logStep(paint(c.gray, "  No matching fields found — the human will fill them."));
    }
    const afterFill = await screenshot(page, runDir, runId, pb.id, "after-fill");
    if (afterFill) result.screenshots.push(afterFill);

    // --- Human gate ---
    await pause(gateInstructions(pb, f));

    // Capture any profile URLs the operator located.
    if (pb.findListingFirst || pb.requiredFields.includes("profileUrl")) {
      const urls = await ask(
        "Profile URL(s) you used (comma-separated, or Enter to skip):"
      );
      if (urls) {
        result.profileUrls = urls.split(",").map((u) => u.trim()).filter(Boolean);
      }
    }

    // Optional: what the broker exposed (drives the dashboard's "what we found").
    const exposed = await ask(
      "What did the broker expose? (e.g. 'current address, 2 phones, 3 relatives' — Enter to skip):"
    );
    if (exposed) {
      result.exposed = exposed.split(",").map((e) => e.trim()).filter(Boolean);
      result.listed = true;
    }

    // --- Outcome status ---
    const status = await askStatus();
    result.status = status;
    if (status === "removed-confirmed" || status === "submitted" || status === "pending-verification") {
      result.listed = result.listed === "unknown" ? true : result.listed;
    }
    if (status === "not-listed") result.listed = false;

    // Manual-action + expiry for the to-do list.
    if (status === "pending-verification" || status === "needs-manual") {
      result.manualAction =
        pb.verification === "phone-call"
          ? "Answer the automated phone call from Whitepages and enter the on-screen code (must be done live)."
          : pb.verification === "email+second-code"
          ? "Open the verification email FAST, then enter the second code (email/phone)."
          : "Open the verification email and click the confirmation link to finalize.";
      if (pb.expiryWindow) result.expiresAt = computeExpiry(pb.expiryWindow);
    }
    if (status === "blocked") {
      const why = await ask("Blocked — what happened? (bot wall / CAPTCHA loop / error):");
      result.notes = why || "Operator marked blocked.";
    }

    // --- Final proof screenshot ---
    const final = await screenshot(page, runDir, runId, pb.id, `final-${status}`);
    if (final) result.screenshots.push(final);

    if (!result.notes) {
      result.notes = pb.network ? `Network note: ${pb.network}` : "";
    }
  } catch (err) {
    // Never let one broker kill the run.
    result.status = "blocked";
    result.notes = `Engine error: ${err instanceof Error ? err.message : String(err)}`;
    logStep(paint(c.red, `  ERROR — marked blocked: ${result.notes}`));
    try {
      const shot = await screenshot(page, runDir, runId, pb.id, "error");
      if (shot) result.screenshots.push(shot);
    } catch {
      /* ignore */
    }
  } finally {
    result.finishedAt = new Date().toISOString();
    try {
      await page.close();
    } catch {
      /* ignore */
    }
  }

  return result;
}

/**
 * Ask the operator to pick an outcome status.
 * @returns {Promise<import('./types.mjs').RemovalStatus>}
 */
async function askStatus() {
  process.stdout.write("\n  " + paint(c.bold, "Outcome status:\n"));
  OUTCOME_STATUSES.forEach((s, i) => {
    process.stdout.write(paint(c.gray, `    ${i + 1}) ${s}\n`));
  });
  const answer = await ask(`Pick 1-${OUTCOME_STATUSES.length} (default 2 = pending-verification):`);
  const n = parseInt(answer, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= OUTCOME_STATUSES.length) {
    return OUTCOME_STATUSES[n - 1];
  }
  // Allow typing the status name directly too.
  const byName = OUTCOME_STATUSES.find((s) => s === answer.trim().toLowerCase());
  if (byName) return byName;
  return "pending-verification";
}

/**
 * Translate a fuzzy expiry window string into a rough ISO deadline.
 * @param {string} window
 * @returns {string}
 */
function computeExpiry(window) {
  const w = window.toLowerCase();
  let hours = 48; // sane default for an email link
  if (w.includes("15 min")) hours = 0.25;
  else if (w.includes("24 h")) hours = 24;
  else if (w.includes("48 h")) hours = 48;
  else if (w.includes("30+")) hours = 1;
  else if (w.includes("15 day")) hours = 24 * 15;
  else if (w.includes("one sitting")) hours = 0.5;
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

// ---------------------------------------------------------------------------
// Run id + run dir
// ---------------------------------------------------------------------------
function makeRunId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Find the most recent run dir that has a result.json (for --resume). */
function findLatestRun() {
  if (!fs.existsSync(RUNS_ROOT)) return null;
  const dirs = fs
    .readdirSync(RUNS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{8}-\d{6}$/.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse();
  for (const name of dirs) {
    const rp = path.join(RUNS_ROOT, name, "result.json");
    if (fs.existsSync(rp)) return { runId: name, resultPath: rp };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Selftest
// ---------------------------------------------------------------------------
async function selftest() {
  process.stdout.write(paint(c.bold + c.magenta, "\n  VANISH engine selftest (headless)\n\n"));
  const runId = makeRunId();
  const runDir = path.join(RUNS_ROOT, `selftest-${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  let session;
  try {
    session = await launch({ headless: true });
    const page = await session.context.newPage();
    logStep("Navigating to https://example.com …");
    await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    const shot = await screenshot(page, runDir, `selftest-${runId}`, "example", "smoke");
    await page.close();
    if (!shot) throw new Error("Screenshot pipeline produced no file.");
    const abs = path.join(runDir, "example", path.basename(shot.path));
    if (!fs.existsSync(abs)) throw new Error(`Expected screenshot missing at ${abs}`);
    process.stdout.write(paint(c.green, `\n  Screenshot saved: ${abs}\n`));
    process.stdout.write(paint(c.bold + c.green, "  SELFTEST OK\n\n"));
    return 0;
  } catch (err) {
    process.stdout.write(
      paint(c.bold + c.red, `\n  SELFTEST FAILED: ${err instanceof Error ? err.message : err}\n\n`)
    );
    return 1;
  } finally {
    if (session) await session.close();
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
/** @param {import('./types.mjs').RunResult} run */
function printSummary(run) {
  const toneFor = {
    "removed-confirmed": c.green,
    submitted: c.yellow,
    "pending-verification": c.yellow,
    "needs-manual": c.yellow,
    "not-listed": c.gray,
    blocked: c.red,
    "in-progress": c.yellow,
    queued: c.gray,
  };
  process.stdout.write("\n" + paint(c.bold + c.magenta, "  ── Run summary ──────────────────────────────\n"));
  for (const b of run.brokers) {
    const tone = toneFor[b.status] || c.gray;
    const name = b.brokerName.padEnd(26, " ");
    const shots = paint(c.gray, `${b.screenshots.length} shot(s)`);
    process.stdout.write(`  ${name} ${paint(tone, b.status.padEnd(22))} ${shots}\n`);
  }

  const todos = run.brokers.filter(
    (b) => b.status === "pending-verification" || b.status === "needs-manual"
  );
  if (todos.length) {
    process.stdout.write("\n" + paint(c.bold + c.yellow, "  ── YOUR TO-DOS ──────────────────────────────\n"));
    for (const b of todos) {
      process.stdout.write(paint(c.bold, `  • ${b.brokerName}\n`));
      if (b.manualAction) process.stdout.write(paint(c.gray, `      ${b.manualAction}\n`));
      if (b.expiresAt) {
        process.stdout.write(paint(c.red, `      Expires: ${b.expiresAt}\n`));
      }
    }
  } else {
    process.stdout.write("\n" + paint(c.green, "  No outstanding to-dos.\n"));
  }
  process.stdout.write(
    "\n" + paint(c.gray, "  Brokers re-list over time — recheck in 3–6 months.\n\n")
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.selftest) {
    process.exit(await selftest());
  }

  banner();

  // --- Load + validate profile ---
  let profile;
  try {
    profile = loadProfile(args.profile);
  } catch (err) {
    process.stdout.write(paint(c.bold + c.red, `\n  Cannot start: ${err instanceof Error ? err.message : err}\n\n`));
    process.exit(1);
  }
  const problems = validateProfile(profile);
  if (problems.length) {
    process.stdout.write(paint(c.bold + c.red, "\n  REFUSING TO RUN — profile invalid:\n"));
    for (const p of problems) process.stdout.write(paint(c.red, `    • ${p}\n`));
    process.stdout.write("\n");
    process.exit(1);
  }

  const f = deriveFields(profile);
  process.stdout.write(
    paint(c.gray, `  Subject: ${f.fullName}  ·  ${f.city}, ${f.state}  ·  ${f.email}\n`)
  );

  // --- Resolve run id / dir (resume or new) ---
  let runId = makeRunId();
  /** @type {import('./types.mjs').BrokerResult[]} */
  let priorResults = [];
  if (args.resume) {
    const latest = findLatestRun();
    if (latest) {
      runId = latest.runId;
      try {
        const prior = JSON.parse(fs.readFileSync(latest.resultPath, "utf8"));
        priorResults = Array.isArray(prior.brokers) ? prior.brokers : [];
        process.stdout.write(paint(c.cyan, `  Resuming run ${runId} (${priorResults.length} prior result(s)).\n`));
      } catch {
        process.stdout.write(paint(c.yellow, `  Could not parse prior run — starting fresh ${runId}.\n`));
      }
    } else {
      process.stdout.write(paint(c.yellow, "  --resume: no prior run found, starting fresh.\n"));
    }
  }
  const runDir = path.join(RUNS_ROOT, runId);
  fs.mkdirSync(runDir, { recursive: true });

  // --- Pick brokers ---
  let playbooks = PLAYBOOKS;
  if (args.only && args.only.length) {
    playbooks = PLAYBOOKS.filter((pb) => args.only.includes(pb.id));
    if (!playbooks.length) {
      process.stdout.write(paint(c.bold + c.red, `\n  --only matched no brokers: ${args.only.join(", ")}\n`));
      process.stdout.write(paint(c.gray, `  Valid ids: ${PLAYBOOKS.map((p) => p.id).join(", ")}\n\n`));
      process.exit(1);
    }
  }

  const doneIds = new Set(
    priorResults
      .filter((r) => r.status === "removed-confirmed" || r.status === "submitted")
      .map((r) => r.brokerId)
  );

  // Seed results with prior ones so the JSON stays complete across resumes.
  /** @type {Map<string, import('./types.mjs').BrokerResult>} */
  const resultsById = new Map(priorResults.map((r) => [r.brokerId, r]));

  resetScreenshotCounters();

  /** @type {import('./types.mjs').RunResult} */
  const run = {
    runId,
    profileId: profile.id || "unknown",
    customerName: profile.fullName,
    startedAt: new Date().toISOString(),
    brokers: [],
  };

  // --- Launch the browser ---
  let session;
  try {
    session = await launch({ headless: false });
  } catch (err) {
    process.stdout.write(
      paint(c.bold + c.red, `\n  Could not launch a browser: ${err instanceof Error ? err.message : err}\n`)
    );
    process.stdout.write(paint(c.gray, "  Run: npx playwright install chromium\n\n"));
    process.exit(1);
  }

  try {
    for (let i = 0; i < playbooks.length; i++) {
      const pb = playbooks[i];
      if (args.resume && doneIds.has(pb.id)) {
        process.stdout.write(
          "\n" + paint(c.gray, `[${i + 1}/${playbooks.length}] ${pb.name} — already done (${resultsById.get(pb.id)?.status}); skipping.\n`)
        );
        continue;
      }
      const res = await processBroker(session.context, pb, f, runDir, runId, i, playbooks.length);
      resultsById.set(pb.id, res);

      // Persist after every broker so a crash never loses progress.
      run.brokers = Array.from(resultsById.values());
      writeResult(run, runDir);
    }
  } finally {
    await session.close();
  }

  run.finishedAt = new Date().toISOString();
  run.brokers = Array.from(resultsById.values());
  writeResult(run, runDir);

  printSummary(run);
  process.stdout.write(
    paint(c.gray, `  Result: ${path.join(runDir, "result.json")}\n`) +
      paint(c.gray, `  Dashboard reads: ${path.join(RUNS_ROOT, "latest.json")}\n\n`)
  );
}

/**
 * Write result.json into the run dir AND copy the full object to latest.json.
 * @param {import('./types.mjs').RunResult} run
 * @param {string} runDir
 */
function writeResult(run, runDir) {
  const json = JSON.stringify(run, null, 2);
  try {
    fs.writeFileSync(path.join(runDir, "result.json"), json);
    fs.mkdirSync(RUNS_ROOT, { recursive: true });
    fs.writeFileSync(path.join(RUNS_ROOT, "latest.json"), json);
  } catch (err) {
    process.stdout.write(
      paint(c.yellow, `  Warning: could not write result: ${err instanceof Error ? err.message : err}\n`)
    );
  }
}

// Top-level guard so nothing ever throws uncaught.
main().catch((err) => {
  process.stdout.write(
    paint(c.bold + c.red, `\n  Fatal: ${err instanceof Error ? err.stack || err.message : err}\n\n`)
  );
  process.exit(1);
});
