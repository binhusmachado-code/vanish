import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-line bg-ink-soft/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-safe" />
              <span className="text-lg font-semibold tracking-[0.18em]">
                {BRAND.name}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{BRAND.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-muted">
                Product
              </p>
              <Link href="/scan" className="block text-muted hover:text-bone">
                Free scan
              </Link>
              <Link href="/pricing" className="block text-muted hover:text-bone">
                Pricing
              </Link>
              <Link href="/start" className="block text-muted hover:text-bone">
                Get protected
              </Link>
              <Link href="/dashboard" className="block text-muted hover:text-bone">
                Dashboard
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-muted">
                Legal
              </p>
              <Link href="/privacy" className="block text-muted hover:text-bone">
                Privacy policy
              </Link>
              <Link href="/terms" className="block text-muted hover:text-bone">
                Terms
              </Link>
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="block text-muted hover:text-bone"
              >
                Support
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-muted">
          © {year} {BRAND.name}. We help you exercise your legal right to data
          deletion. We are not affiliated with any data broker.
        </p>
      </div>
    </footer>
  );
}
