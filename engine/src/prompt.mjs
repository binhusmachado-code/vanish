/**
 * Terminal UX + readline helpers for the human-in-the-loop gates.
 *
 * No dependencies — raw ANSI escape codes and Node's built-in readline.
 * Everything degrades gracefully if stdin isn't a TTY (e.g. piped input):
 * pause() resolves immediately so non-interactive runs don't hang forever.
 */

import readline from "node:readline";

// --- ANSI palette (raw escape codes, no chalk) -----------------------------
const ESC = "\x1b[";
export const c = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  gray: `${ESC}90m`,
  bgRed: `${ESC}41m`,
  bgYellow: `${ESC}43m`,
  bgBlue: `${ESC}44m`,
  black: `${ESC}30m`,
};

/** Wrap text in a color, always resetting after. */
export function paint(color, text) {
  return `${color}${text}${c.reset}`;
}

const isInteractive = Boolean(process.stdin.isTTY);

/**
 * Create a one-shot readline interface, ask a question, resolve the answer.
 * Closes the interface afterward so the process can exit cleanly.
 * @param {string} query
 * @returns {Promise<string>}
 */
function readLineOnce(query) {
  return new Promise((resolve) => {
    if (!isInteractive) {
      // Non-interactive (piped / CI): can't prompt — return empty.
      resolve("");
      return;
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve((answer ?? "").trim());
    });
  });
}

/**
 * Free-text question.
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function ask(question) {
  return readLineOnce(`${paint(c.cyan, "?")} ${question} `);
}

/**
 * Yes/no confirmation. Defaults to true on a bare Enter.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
export async function confirm(question) {
  const answer = await readLineOnce(
    `${paint(c.cyan, "?")} ${question} ${paint(c.dim, "[Y/n]")} `
  );
  if (answer === "") return true;
  return /^y(es)?$/i.test(answer);
}

/**
 * Render a clearly-formatted, colored "ACTION NEEDED" box and wait for Enter.
 * Used for every human-only gate (CAPTCHA / SMS / email-link / phone call).
 *
 * @param {string} message  the exact instructions for the operator
 * @returns {Promise<void>}
 */
export async function pause(message) {
  const width = 72;
  const line = "─".repeat(width - 2);
  const title = " ACTION NEEDED ";
  const pad = Math.max(0, width - 2 - title.length);
  const leftPad = Math.floor(pad / 2);
  const rightPad = pad - leftPad;

  process.stdout.write("\n");
  process.stdout.write(
    paint(c.bold + c.yellow, `┌${line}┐`) + "\n"
  );
  process.stdout.write(
    paint(c.bold + c.yellow, "│") +
      paint(c.bold + c.bgYellow + c.black, " ".repeat(leftPad) + title + " ".repeat(rightPad)) +
      paint(c.bold + c.yellow, "│") +
      "\n"
  );
  process.stdout.write(
    paint(c.bold + c.yellow, `├${line}┤`) + "\n"
  );

  for (const raw of wrap(message, width - 4)) {
    const text = raw.padEnd(width - 4, " ");
    process.stdout.write(
      paint(c.yellow, "│ ") + text + paint(c.yellow, " │") + "\n"
    );
  }

  process.stdout.write(
    paint(c.bold + c.yellow, `└${line}┘`) + "\n"
  );

  if (!isInteractive) {
    process.stdout.write(
      paint(c.dim, "  (non-interactive stdin — auto-continuing)\n")
    );
    return;
  }
  await readLineOnce(paint(c.bold, "  Press Enter when done to continue… "));
}

/**
 * Word-wrap a multi-line string to a max width, preserving explicit newlines.
 * @param {string} text
 * @param {number} max
 * @returns {string[]}
 */
function wrap(text, max) {
  /** @type {string[]} */
  const out = [];
  for (const paragraph of String(text).split("\n")) {
    if (paragraph.trim() === "") {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      if (word.length > max) {
        // Hard-break very long tokens (e.g. URLs).
        if (current) {
          out.push(current);
          current = "";
        }
        let rest = word;
        while (rest.length > max) {
          out.push(rest.slice(0, max));
          rest = rest.slice(max);
        }
        current = rest;
        continue;
      }
      if ((current + (current ? " " : "") + word).length > max) {
        out.push(current);
        current = word;
      } else {
        current += (current ? " " : "") + word;
      }
    }
    if (current) out.push(current);
  }
  return out;
}
