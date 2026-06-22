import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"
      >
        <Link href="/" className="group flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-safe shadow-[0_0_12px] shadow-safe/70" />
          <span className="text-lg font-semibold tracking-[0.18em]">
            {BRAND.name}
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <a href="/#how" className="transition-colors hover:text-bone">
            How it works
          </a>
          <a href="/#proof" className="transition-colors hover:text-bone">
            Proof
          </a>
          <Link href="/pricing" className="transition-colors hover:text-bone">
            Pricing
          </Link>
        </div>

        <Link
          href="/scan"
          className="rounded-full bg-bone px-5 py-2 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5"
        >
          Free scan
        </Link>
      </nav>
    </header>
  );
}
