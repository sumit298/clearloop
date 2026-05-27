"use client";

import { useUsers } from '@/lib/hooks/useUsers';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function TeamPage() {
  const { data: users, isLoading } = useUsers();
  const { user: currentUser } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Manage team members and permissions
          </p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
        >
          Invite Member
        </button>
      </div>

      {!users || users.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">No team members yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-[14px] font-medium text-primary-soft">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-[13px] text-text-muted">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-primary/10 text-primary-soft'
                        : user.role === 'MANAGER'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="rounded-full bg-danger/10 px-3 py-1 text-[12px] font-medium text-danger">
                      Inactive
                    </span>
                  )}
                  {user.id === currentUser?.id && (
                    <span className="text-[12px] text-text-muted">(You)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
