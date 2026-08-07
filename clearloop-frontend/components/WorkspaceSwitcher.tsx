"use client";

import { useMyWorkspaces } from "@/hooks/useAuth";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { workspace, switchWorkspace } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const { data: workspaces } = useMyWorkspaces();
  const hasMultiple = (workspaces?.length ?? 0) > 1;

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === workspace?.id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchWorkspace(tenantId);
      setOpen(false);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to switch workspace");
    } finally {
      setSwitching(false);
    }
  };
  return (
    <div className={`relative ${compact ? "" : "border-b border-border px-6 py-4"}`}>
      <button
        type="button"
        onClick={() => hasMultiple && setOpen((v) => !v)}
        className={`flex items-center justify-between text-left ${compact ? "rounded-md border border-transparent px-2 py-1.5 hover:border-border hover:bg-surface" : "w-full"} ${
          hasMultiple ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div>
          <div className="max-w-[160px] truncate text-[13px] font-medium text-foreground">
            {workspace?.name}
          </div>
          <div className="mt-0.5 text-[11px] text-text-muted">
            {workspace?.slug}
          </div>
        </div>
        {hasMultiple && (
          <span className="text-[11px] text-text-muted">
            {open ? "▲" : "▼"}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-40 mt-1 rounded-md border border-border bg-surface py-1 shadow-lg ${compact ? "left-0 top-full w-60" : "left-4 right-4 top-full"}`}>
          {error && (
            <div className="px-3 py-2 text-[12px] text-danger">{error}</div>
          )}
          {workspaces?.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => handleSwitch(ws.id)}
              disabled={switching}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-surface-2 disabled:opacity-50"
            >
              <div>
                <div className="font-medium text-foreground">{ws.name}</div>
                <div className="text-[11px] text-text-muted">{ws.slug}</div>
              </div>
              {ws.isCurrent && <span className="text-primary-soft">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
