import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RunResult } from "./engine-types";

/** Reads the operator's most recent run (public/runs/latest.json). */
export async function getLatestRun(): Promise<RunResult | null> {
  return readRunFile(path.join(process.cwd(), "public", "runs", "latest.json"));
}

/** Reads one customer's run by their private tracking token. */
export async function getRunByToken(token: string): Promise<RunResult | null> {
  // Guard against path traversal — tokens are UUIDs.
  if (!/^[a-zA-Z0-9-]+$/.test(token)) return null;
  return readRunFile(
    path.join(process.cwd(), "public", "runs", token, "result.json"),
  );
}

async function readRunFile(file: string): Promise<RunResult | null> {
  try {
    const data = JSON.parse(await readFile(file, "utf8")) as RunResult;
    if (!data || !Array.isArray(data.brokers)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Reads a customer's contact sidecar (server-only, never web-served). */
export async function getCustomer(
  token: string,
): Promise<{ token: string; name: string; email: string } | null> {
  if (!/^[a-zA-Z0-9-]+$/.test(token)) return null;
  try {
    const file = path.join(process.cwd(), "data", "customers", `${token}.json`);
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export function summarize(run: RunResult) {
  const total = run.brokers.length;
  const removed = run.brokers.filter(
    (b) => b.status === "removed-confirmed" || b.status === "submitted",
  ).length;
  const inFlight = run.brokers.filter((b) =>
    ["pending-verification", "in-progress"].includes(b.status),
  ).length;
  const todos = run.brokers.filter((b) =>
    ["pending-verification", "needs-manual"].includes(b.status),
  );
  const pct = total === 0 ? 0 : Math.round((removed / total) * 100);
  return { total, removed, inFlight, todos, pct };
}
