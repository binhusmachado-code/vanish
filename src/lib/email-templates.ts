import { BRAND, COVERAGE } from "@/lib/config";

/** Minimal, deliverable HTML shell (inline styles, light background). */
function shell(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0f1014;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#15161c;border:1px solid #2a2c36;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 0;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#7be0a8;vertical-align:middle;"></span>
        <span style="color:#f3f1ea;font-weight:600;letter-spacing:3px;font-size:15px;margin-left:8px;">${BRAND.name}</span>
      </td></tr>
      <tr><td style="padding:20px 32px 32px;color:#c3c5cf;font-size:15px;line-height:1.6;">
        ${body}
      </td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid #2a2c36;color:#7a7d88;font-size:12px;">
        ${BRAND.name} · We help you exercise your legal right to data deletion.<br/>
        Questions? ${BRAND.supportEmail}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#7be0a8;color:#0f1014;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;font-size:15px;">${label}</a>`;
}

export function orderConfirmationEmail(opts: {
  name: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  return {
    subject: `You're protected — your removal has started`,
    html: shell(`
      <h1 style="color:#f3f1ea;font-size:24px;margin:0 0 14px;">You're in, ${first}. 🛡️</h1>
      <p style="margin:0 0 14px;">Payment received and your removal is officially underway. We've begun filing opt-out and deletion requests across <strong style="color:#f3f1ea;">${COVERAGE.brokerCount}+ data brokers</strong> on your behalf.</p>
      <p style="margin:0 0 22px;">You'll get an email each time a broker confirms your removal — and you can watch progress live on your dashboard anytime.</p>
      <p style="margin:0 0 26px;">${button(opts.dashboardUrl, "Track my removal →")}</p>
      <p style="margin:0;color:#7a7d88;font-size:13px;">Removal is ongoing: brokers re-collect data over time, so we keep removing you for as long as you're subscribed.</p>
    `),
  };
}

export function removalUpdateEmail(opts: {
  name: string;
  brokerName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  return {
    subject: `✓ You've been removed from ${opts.brokerName}`,
    html: shell(`
      <h1 style="color:#f3f1ea;font-size:24px;margin:0 0 14px;">One more down. ✓</h1>
      <p style="margin:0 0 14px;">Good news, ${first} — your information has been removed from <strong style="color:#f3f1ea;">${opts.brokerName}</strong>.</p>
      <p style="margin:0 0 22px;">We've logged the proof in your dashboard. We'll keep going through the rest and email you with each one.</p>
      <p style="margin:0;">${button(opts.dashboardUrl, "See the proof →")}</p>
    `),
  };
}
