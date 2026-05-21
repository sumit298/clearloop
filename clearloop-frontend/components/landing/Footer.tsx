import { Logo } from "./Logo";

export function Footer() {
  const cols = [
    {
      h: "Product",
      l: ["Timeline", "Integrations", "AI assistant", "Audit", "Changelog"],
    },
    { h: "Resources", l: ["Docs", "API reference", "Engineering blog", "Status"] },
    { h: "Company", l: ["About", "Customers", "Security", "Pricing", "Contact"] },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] text-text-dim">
              Context and traceability platform for engineering teams.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                {c.h}
              </p>
              <ul className="mt-4 space-y-2.5">
                {c.l.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-[13px] text-text-dim transition-colors hover:text-foreground"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 font-mono text-[11px] text-text-muted md:flex-row md:items-center">
          <span>© 2026 ClearLoop Systems, Inc.</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              all systems operational
            </span>
            <span>SOC 2 Type II</span>
            <span>ISO 27001</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
