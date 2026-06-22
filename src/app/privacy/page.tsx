export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="font-display text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-muted">Last updated: June 2026</p>

      <div className="prose prose-invert mt-12 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-bone">1. Data We Collect</h2>
          <p>
            When you use VANISH, we collect your name, date of birth, email, phone, address, and
            relatives&apos; names. This information is used solely to submit data removal requests to
            brokers on your behalf.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">2. How We Use Your Data</h2>
          <ul className="list-inside space-y-2">
            <li>• Submitting removal requests to data brokers</li>
            <li>• Tracking removal status and confirmations</li>
            <li>• Sending you updates via email</li>
            <li>• Processing payments via Stripe</li>
            <li>• Complying with CCPA and similar privacy laws</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-bone">3. Data Storage & Security</h2>
          <p>
            Your personal information is encrypted at rest and stored in Supabase, a secure
            PostgreSQL database. We never sell, share, or rent your data to third parties.
          </p>
          <p>
            Removal requests are submitted to brokers under your authorization, as permitted by
            CCPA and similar regulations.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">4. Cookies</h2>
          <p>
            We use minimal cookies only for session tracking. We do not use tracking pixels,
            analytics cookies, or third-party cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">5. Retention</h2>
          <p>
            We retain your information for as long as your account is active, plus 90 days after
            account closure (to handle pending removals and chargebacks). You can request deletion
            anytime.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">6. Your Rights</h2>
          <ul className="list-inside space-y-2">
            <li>• Right to access your data</li>
            <li>• Right to correct inaccurate data</li>
            <li>• Right to delete your data</li>
            <li>• Right to opt out of processing</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at privacy@vanish.com.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">7. Third Parties</h2>
          <p>
            We share your data only with data brokers (to request removal) and payment processors
            (Stripe). We do not share with advertisers or marketers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">8. Contact</h2>
          <p>
            Questions? Email privacy@vanish.com
          </p>
        </section>
      </div>
    </div>
  );
}
