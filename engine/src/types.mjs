/**
 * JSDoc typedefs mirroring ../../src/lib/engine-types.ts EXACTLY.
 *
 * The engine writes RunResult JSON; the Next.js dashboard reads it. Field names
 * here MUST stay byte-for-byte identical to engine-types.ts or the dashboard
 * will silently render nothing. If you change one, change both.
 *
 * This file exports nothing at runtime — it exists purely so editors and
 * `node --check` understand the shapes other modules annotate against.
 */

/**
 * @typedef {object} CustomerAddress
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {boolean} current
 */

/**
 * @typedef {object} Authorization
 * @property {boolean} agreed       explicit authorization to act as the customer's agent (CCPA)
 * @property {string} signedName
 * @property {string} signedAt
 */

/**
 * @typedef {object} CustomerProfile
 * @property {string} id
 * @property {string} fullName
 * @property {string[]} nameVariants     maiden/former names, nicknames, common misspellings, suffix
 * @property {string} dob                YYYY-MM-DD; the single best disambiguator against namesakes
 * @property {string[]} emails
 * @property {string} verificationEmail  an inbox the operator can check now for verification links
 * @property {string[]} phones
 * @property {CustomerAddress[]} addresses
 * @property {string[]} relatives        relatives' first names — for identity matching only, never a target
 * @property {Authorization} authorization
 */

/**
 * RemovalStatus — must match the union in engine-types.ts.
 * @typedef {(
 *   'queued' |
 *   'in-progress' |
 *   'submitted' |
 *   'pending-verification' |
 *   'needs-manual' |
 *   'blocked' |
 *   'removed-confirmed' |
 *   'not-listed'
 * )} RemovalStatus
 */

/**
 * @typedef {object} ScreenshotRef
 * @property {string} path     web path served from /public, e.g. /runs/<runId>/spokeo/01-form.png
 * @property {string} label
 * @property {string} takenAt  ISO timestamp
 */

/**
 * @typedef {object} BrokerResult
 * @property {string} brokerId
 * @property {string} brokerName
 * @property {boolean|'unknown'} listed
 * @property {string[]} exposed       what the broker exposed, e.g. ["current address", "2 phones", "3 relatives"]
 * @property {string[]} profileUrls
 * @property {RemovalStatus} status
 * @property {ScreenshotRef[]} screenshots
 * @property {string} [manualAction]  if pending/needs-manual: what the human/customer must do next
 * @property {string} [expiresAt]     verification link expiry, if applicable
 * @property {string} [startedAt]
 * @property {string} [finishedAt]
 * @property {string} [notes]
 */

/**
 * @typedef {object} RunResult
 * @property {string} runId
 * @property {string} profileId
 * @property {string} customerName
 * @property {string} startedAt
 * @property {string} [finishedAt]
 * @property {BrokerResult[]} brokers
 */

/**
 * The valid outcome statuses an operator may pick at a manual gate.
 * (A subset of RemovalStatus — the engine sets queued/in-progress itself.)
 * @type {RemovalStatus[]}
 */
export const OUTCOME_STATUSES = [
  "submitted",
  "pending-verification",
  "needs-manual",
  "blocked",
  "removed-confirmed",
  "not-listed",
];

export {};
