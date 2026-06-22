export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="font-display text-4xl">Terms of Service</h1>
      <p className="mt-2 text-muted">Last updated: June 2026</p>

      <div className="prose prose-invert mt-12 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-bone">1. Acceptance of Terms</h2>
          <p>
            By using VANISH, you agree to these Terms of Service. If you do not agree, do not use
            the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">2. Service Description</h2>
          <p>
            VANISH helps you remove your personal information from data brokers by submitting
            removal requests on your behalf. We are not a law firm and do not provide legal advice.
            Results vary by broker.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">3. Authorization</h2>
          <p>
            By submitting your information, you authorize us to act as your agent to submit
            removal requests to data brokers. This complies with CCPA, GDPR, and similar laws.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">4. Payment & Refunds</h2>
          <ul className="list-inside space-y-2">
            <li>• Billing is annual and recurring unless canceled</li>
            <li>• Refunds are provided within 30 days of purchase</li>
            <li>• After 30 days, refunds are at our discretion</li>
            <li>• Cancel anytime from your dashboard</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-bone">5. Accuracy of Information</h2>
          <p>
            You are responsible for providing accurate information. Inaccurate data may result in
            incomplete removals. We are not liable for removals that fail due to your providing
            wrong information.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">6. Limitations of Liability</h2>
          <p>
            VANISH is provided &quot;as is.&quot; We do not guarantee that all brokers will remove
            your data. Some brokers ignore requests, and some data may persist. We are not liable
            for:
          </p>
          <ul className="list-inside space-y-2">
            <li>• Data brokers ignoring removal requests</li>
            <li>• Third-party site outages or changes</li>
            <li>• Identity theft or misuse of your information</li>
            <li>• Missed confirmation emails</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-bone">7. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-inside space-y-2">
            <li>• Use the service to remove other people&apos;s data without authorization</li>
            <li>• Attempt to hack or reverse-engineer the service</li>
            <li>• Submit false or malicious requests</li>
            <li>• Use automated scraping or bots</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-bone">8. Changes to Terms</h2>
          <p>
            We may update these terms anytime. Continued use after changes means acceptance.
            Critical changes will be emailed to you.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">9. Termination</h2>
          <p>
            We reserve the right to terminate your account if you violate these terms or engage in
            unlawful activity.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-bone">10. Contact</h2>
          <p>Questions? Email support@vanish.com</p>
        </section>
      </div>
    </div>
  );
}
