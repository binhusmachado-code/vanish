/**
 * Chromium launcher + screenshot helper.
 *
 * Headed by default (a present human clears CAPTCHAs / SMS / email-link gates),
 * headless only for --selftest. Prefers a real installed Chrome (channel:'chrome')
 * because brokers fingerprint headless/bundled Chromium harder; falls back to
 * Playwright's bundled chromium if Chrome isn't present.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

/** Generous navigation timeout — broker pages are slow and bot-walled. */
export const NAV_TIMEOUT_MS = 45_000;

/**
 * @typedef {object} LaunchOptions
 * @property {boolean} [headless]  force headless (selftest). Default: false (headed).
 */

/**
 * @typedef {object} Session
 * @property {import('playwright').Browser} browser
 * @property {import('playwright').BrowserContext} context
 * @property {() => Promise<void>} close
 */

/**
 * Launch Chromium. Tries real Chrome first, then bundled chromium.
 * @param {LaunchOptions} [opts]
 * @returns {Promise<Session>}
 */
export async function launch(opts = {}) {
  const headless = Boolean(opts.headless);

  const baseArgs = {
    headless,
    // A realistic viewport + slowMo make headed form-filling watchable.
    args: ["--disable-blink-features=AutomationControlled", "--start-maximized"],
  };

  /** @type {import('playwright').Browser} */
  let browser;
  try {
    // Prefer the user's installed Chrome (less bot-detected than bundled).
    browser = await chromium.launch({ ...baseArgs, channel: "chrome" });
  } catch {
    // Fall back to Playwright's bundled chromium.
    browser = await chromium.launch(baseArgs);
  }

  const context = await browser.newContext({
    viewport: headless ? { width: 1280, height: 900 } : null, // null = use full window when headed
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  context.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
  context.setDefaultTimeout(15_000);

  return {
    browser,
    context,
    close: async () => {
      try {
        await context.close();
      } catch {
        /* ignore */
      }
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Per-broker screenshot counters so files sort 01, 02, 03… */
const counters = new Map();

/**
 * Screenshot the current page as proof and return a ScreenshotRef.
 * Saves to <runDir>/<brokerId>/NN-<label>.png and returns a web path
 * /runs/<runId>/<brokerId>/NN-<label>.png that the dashboard can serve.
 *
 * Never throws — screenshot failures degrade to a recorded note upstream.
 *
 * @param {import('playwright').Page} page
 * @param {string} runDir   absolute path to <repoRoot>/public/runs/<runId>
 * @param {string} runId
 * @param {string} brokerId
 * @param {string} label    short kebab-ish label, e.g. "landing", "after-fill"
 * @returns {Promise<import('./types.mjs').ScreenshotRef|null>}
 */
export async function screenshot(page, runDir, runId, brokerId, label) {
  const key = brokerId;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  const nn = String(next).padStart(2, "0");
  const safeLabel = String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "step";
  const fileName = `${nn}-${safeLabel}.png`;

  const dir = path.join(runDir, brokerId);
  try {
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, fileName), fullPage: true });
  } catch {
    // Try a viewport-only screenshot as a fallback (fullPage can fail on huge/odd pages).
    try {
      await page.screenshot({ path: path.join(dir, fileName) });
    } catch {
      return null;
    }
  }

  return {
    path: `/runs/${runId}/${brokerId}/${fileName}`,
    label: String(label),
    takenAt: new Date().toISOString(),
  };
}

/** Reset counters between runs (used by tests / multiple runs in one process). */
export function resetScreenshotCounters() {
  counters.clear();
}
