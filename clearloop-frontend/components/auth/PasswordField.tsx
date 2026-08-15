"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  minLength,
  required = true,
  labelAction,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  /** Rendered on the right of the label row, e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-[12px] font-medium">
      <span className="flex items-center justify-between">
        {label}
        {labelAction}
      </span>
      <span className="relative mt-1.5 block">
        <input
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-border bg-surface pr-10 pl-3 text-[13px] outline-none focus:border-primary"
        />
        <button
          type="button"
          // Toggling is not a form action — keep it out of the tab order's way
          // only visually; screen readers still get the state from aria-pressed.
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}
