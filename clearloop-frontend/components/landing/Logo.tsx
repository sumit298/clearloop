export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8.5" stroke="#B1A3FA" strokeWidth="1.25" />
        <circle cx="10" cy="10" r="4.25" stroke="#554091" strokeWidth="1.25" />
        <circle cx="10" cy="10" r="1.25" fill="#8739D5" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        ClearLoop
      </span>
    </div>
  );
}
