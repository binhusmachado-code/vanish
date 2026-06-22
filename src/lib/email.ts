/**
 * Pluggable transactional email.
 *
 * Uses Resend (https://resend.com) via its REST API — no npm dependency, just
 * fetch + an API key (free tier: 3,000 emails/mo). If RESEND_API_KEY isn't set,
 * emails are logged to the server console instead of sent, so the app works in
 * development without any account.
 *
 *   RESEND_API_KEY   your Resend key (re_...)
 *   EMAIL_FROM       e.g. "VANISH <hello@yourdomain.com>"
 *                    (until you verify a domain, Resend only allows
 *                     "onboarding@resend.dev" → your own account email)
 */

const FROM = process.env.EMAIL_FROM ?? "VANISH <onboarding@resend.dev>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; logged?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev fallback: don't fail the flow, just record what would've been sent.
    console.log(`[email:dev] would send → ${msg.to} | ${msg.subject}`);
    return { ok: true, logged: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: msg.to, subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] send failed (${res.status}): ${detail}`);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error(`[email] ${message}`);
    return { ok: false, error: message };
  }
}
