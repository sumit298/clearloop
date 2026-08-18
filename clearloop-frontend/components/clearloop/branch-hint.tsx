"use client";

import { useState } from "react";
import { Check, Copy, GitBranch } from "lucide-react";
import { checkoutCommand } from "@/lib/git/branch";

/**
 * The "start work" affordance: the exact command to run, one click to copy.
 * Nobody retypes a branch name off a screen, so the copy button is the
 * feature — the text is just there to show what you're about to get.
 */
export function BranchHint({
  branch,
  title = "Start working on this",
  hint,
}: {
  branch: string;
  title?: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState<"branch" | "command" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  const copy = (value: string, which: "branch" | "command") => {
    // The clipboard API is unavailable over plain HTTP and can be denied by
    // permissions. Say so instead of leaving a dead button — the command is
    // rendered as selectable text, so there is always a manual fallback.
    if (!navigator.clipboard?.writeText) {
      setCopyFailed(true);
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopyFailed(false);
        setCopied(which);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => setCopyFailed(true));
  };

  const command = checkoutCommand(branch);

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <GitBranch className="size-3.5 text-muted-foreground" />
        {title}
      </div>

      <p className="mt-1 text-[12px] text-muted-foreground">
        {hint ??
          "Push a branch with this name and ClearLoop links the pull request automatically."}
      </p>

      <div className="mt-3 flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-[12px] whitespace-nowrap">
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command, "command")}
          aria-label="Copy git command"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] hover:bg-surface-raised"
        >
          {copied === "command" ? (
            <>
              <Check className="size-3.5 text-success" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={() => copy(branch, "branch")}
        className="mt-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
      >
        {copied === "branch" ? "Branch name copied" : `or copy just the branch name`}
      </button>

      {copyFailed && (
        <p className="mt-2 text-[11px] text-destructive">
          Couldn&apos;t reach the clipboard — select the command above and copy it manually.
        </p>
      )}
    </div>
  );
}
