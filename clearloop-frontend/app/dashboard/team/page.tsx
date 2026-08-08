"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, ResultCount } from "@/components/clearloop/toolbar";
import { RoleChip } from "@/components/clearloop/status";
import { useUsers } from "@/lib/hooks/useUsers";
import { useInvitations, useCreateInvitation, useResendInvitation, useCancelInvitation } from "@/lib/hooks/useInvitations";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { Invitation } from "@/lib/api/invitations";

const ROLES: Invitation["role"][] = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"];

export default function TeamPage() {
  const { data: users, isLoading } = useUsers();
  const { data: invitations } = useInvitations();
  const { user: currentUser } = useAuth();
  const createInvitation = useCreateInvitation();
  const resendInvitation = useResendInvitation();
  const cancelInvitation = useCancelInvitation();

  const [q, setQ] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<{ email: string; role: Invitation["role"] }>({ email: "", role: "DEVELOPER" });
  const [error, setError] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  const rows = (users || []).filter((u) => (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase()));

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await createInvitation.mutateAsync(form);
      setShowInvite(false);
      setForm({ email: "", role: "DEVELOPER" });
      if (!result.emailSent) setError(`Invitation created but the email to ${result.email} could not be delivered. Use Resend to retry.`);
    }
    catch (err: any) { setError(err.response?.data?.message || "Failed to send invitation"); }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try { await resendInvitation.mutateAsync(id); }
    catch (err: any) { setError(err.response?.data?.message || "Failed to resend"); }
    finally { setResendingId(null); }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading team…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        description="Roles map to what someone can do: admins install apps, developers ship, viewers read."
        actions={
          canManage && (
            <button onClick={() => setShowInvite(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
              <UserPlus className="size-3.5" /> Invite member
            </button>
          )
        }
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search people…" />
        <ResultCount count={rows.length} noun="member" />
      </Toolbar>

      <div className="space-y-5 p-6">
        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</div>}

        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState icon={UserPlus} title="Nobody matches that search" description="Search by name, email or role — or invite someone new." action={<button onClick={() => setQ("")} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px]">Clear search</button>} />
          </div>
        ) : (
          <div className="panel overflow-hidden">
            {rows.map((u) => (
              <div key={u.id} className="row-hover flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised font-mono text-[12px] font-medium" style={{ color: `hsl(${u.name.charCodeAt(0) * 7 % 360} 60% 55%)` }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate text-[13px] font-medium">
                    {u.name}
                    {u.id === currentUser?.id && <span className="font-mono text-[11px] text-muted-foreground">(you)</span>}
                  </div>
                  <div className="font-mono text-[12px] text-muted-foreground">{u.email}</div>
                </div>
                <RoleChip role={u.role} />
                {!u.isActive && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">Inactive</span>}
                <button aria-label={`Email ${u.name}`} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground">
                  <Mail className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {canManage && (invitations?.length ?? 0) > 0 && (
          <div className="panel overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Pending invitations</h2>
            </header>
            {invitations!.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{inv.email}</div>
                  <div className="font-mono text-[12px] text-muted-foreground">
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => handleResend(inv.id)} disabled={resendingId === inv.id} className="h-7 rounded-md border border-border px-2.5 text-[12px] disabled:opacity-50">
                  {resendingId === inv.id ? "Sending…" : "Resend"}
                </button>
                <button onClick={() => cancelInvitation.mutate(inv.id)} disabled={cancelInvitation.isPending} className="h-7 rounded-md border border-destructive/30 px-2.5 text-[12px] text-destructive disabled:opacity-50">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl">
            <h2 className="text-[16px] font-semibold">Invite member</h2>
            <form onSubmit={handleInvite} className="mt-5 space-y-4">
              {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</div>}
              <div>
                <label className="text-[12px] font-medium">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Invitation["role"] })} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowInvite(false); setError(""); }} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
                <button type="submit" disabled={createInvitation.isPending} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                  {createInvitation.isPending ? "Sending…" : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
