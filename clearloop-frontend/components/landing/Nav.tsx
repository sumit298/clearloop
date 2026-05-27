import Link from "next/link";
import { Logo } from "./Logo";

const nav = [
  { label: "Product", href: "#product" },
  { label: "Timeline", href: "#timeline" },
  { label: "Integrations", href: "#integrations" },
  { label: "Changelog", href: "#changelog" },
  { label: "Docs", href: "#docs" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="text-[13px] text-text-dim transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden rounded-md px-3 py-1.5 text-[13px] text-text-dim transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface-2 px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-primary-soft/40 hover:bg-surface"
          >
            Start free
            <span className="text-text-muted">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
