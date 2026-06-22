/**
 * Shared contracts between the removal engine (engine/) and the web app.
 * The engine writes RunResult JSON; the dashboard reads it. Keep these in
 * sync with engine/src/types.ts.
 */

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  current: boolean;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  /** maiden/former names, nicknames, common misspellings, suffix */
  nameVariants: string[];
  /** YYYY-MM-DD; the single best disambiguator against namesakes */
  dob: string;
  emails: string[];
  /** an inbox the operator can check now for verification links */
  verificationEmail: string;
  phones: string[];
  addresses: CustomerAddress[];
  /** relatives' first names — for identity matching only, never a target */
  relatives: string[];
  /** explicit authorization to act as the customer's agent (CCPA) */
  authorization: {
    agreed: boolean;
    signedName: string;
    signedAt: string;
  };
  /** applied coupon code, if any (e.g. founder comp before Stripe) */
  couponCode?: string;
}

export type RemovalStatus =
  | "queued"
  | "in-progress"
  | "submitted"
  | "pending-verification"
  | "needs-manual"
  | "blocked"
  | "removed-confirmed"
  | "not-listed";

export interface ScreenshotRef {
  /** web path served from /public, e.g. /runs/<runId>/spokeo/01-form.png */
  path: string;
  label: string;
  takenAt: string;
}

export interface BrokerResult {
  brokerId: string;
  brokerName: string;
  listed: boolean | "unknown";
  /** what the broker exposed: e.g. ["current address", "2 phones", "3 relatives"] */
  exposed: string[];
  profileUrls: string[];
  status: RemovalStatus;
  screenshots: ScreenshotRef[];
  /** if status is pending/needs-manual: what the human/customer must do next */
  manualAction?: string;
  /** verification link expiry, if applicable */
  expiresAt?: string;
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
}

export interface RunResult {
  runId: string;
  profileId: string;
  customerName: string;
  startedAt: string;
  finishedAt?: string;
  brokers: BrokerResult[];
}

export const STATUS_META: Record<
  RemovalStatus,
  { label: string; tone: "safe" | "amber" | "exposed" | "muted" }
> = {
  queued: { label: "Queued", tone: "muted" },
  "in-progress": { label: "In progress", tone: "amber" },
  submitted: { label: "Submitted", tone: "amber" },
  "pending-verification": { label: "Awaiting your verification", tone: "amber" },
  "needs-manual": { label: "Needs a manual step", tone: "amber" },
  blocked: { label: "Blocked", tone: "exposed" },
  "removed-confirmed": { label: "Removed ✓", tone: "safe" },
  "not-listed": { label: "Not listed", tone: "muted" },
};
