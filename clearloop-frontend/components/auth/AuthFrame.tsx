import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/landing/Logo";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-90">
            <Logo className="[&>span+span]:hidden" />
            <h1 className="mt-6 text-[24px] font-semibold leading-tight">{title}</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-[12px] text-muted-foreground">{footer}</div>
          </div>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="relative flex h-full flex-col justify-center gap-8 px-12">
          <div>
            <div className="font-mono text-[12px] text-primary">the loop, today</div>
            <p className="mt-3 max-w-sm text-[18px] leading-snug tracking-tight">
              &ldquo;We deleted our weekly status doc the day we connected the first repo.&rdquo;
            </p>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Miles Cheng · Engineering Manager, Northwind Labs
            </p>
          </div>
          <div className="panel max-w-sm overflow-hidden">
            <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Live activity
            </div>
            {[
              "Merged the GitHub App installation",
              "Linked a pull request to WEB-153",
              "Released version 2.4.0",
              "Created a feature from a customer request",
            ].map((item, index) => (
              <div key={item} className="flex gap-3 border-b border-border px-4 py-2 text-[12px] last:border-b-0">
                <span className="min-w-0 flex-1 text-muted-foreground">{item}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{index + 1}h</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
