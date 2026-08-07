import { Rocket } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex size-5 items-center justify-center rounded-md border border-border bg-primary text-primary-foreground"><Rocket className="size-3" strokeWidth={2.5} /></span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        ClearLoop
      </span>
    </div>
  );
}
