import { AlertCircle } from "lucide-react";

/**
 * Sits directly next to the control that failed. An error banner parked at the
 * top of a long form is off-screen by the time the user reaches the submit
 * button, which reads as "nothing happened".
 */
export function FormError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
