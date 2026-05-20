'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api/client';
import type { User, UserRole } from '@/types';

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'DEVELOPER' as UserRole,
    designation: '',
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = auth.getToken();
      if (!token) return;

      const data = await api.getUsers(token);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const token = auth.getToken();
      if (!token) return;

      await api.inviteUser(token, formData);
      setShowInviteModal(false);
      setFormData({ email: '', name: '', role: 'DEVELOPER', designation: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className=\"flex h-full items-center justify-center\">
        <div className=\"text-text-muted\">Loading...</div>
      </div>
    );
  }

  return (
    <div className=\"p-8\">
      <div className=\"mb-8 flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-semibold tracking-tight\">Team</h1>
          <p className=\"mt-2 text-[15px] text-text-dim\">
            Manage your team members and permissions
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className=\"rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover\"
        >
          Invite Member
        </button>
      </div>

      <div className=\"rounded-xl border border-border bg-surface\">
        <div className=\"overflow-x-auto\">
          <table className=\"w-full\">
            <thead>
              <tr className=\"border-b border-border\">
                <th className=\"px-6 py-3 text-left text-[12px] font-medium text-text-muted\">
                  Name
                </th>
                <th className=\"px-6 py-3 text-left text-[12px] font-medium text-text-muted\">
                  Email
                </th>
                <th className=\"px-6 py-3 text-left text-[12px] font-medium text-text-muted\">
                  Role
                </th>
                <th className=\"px-6 py-3 text-left text-[12px] font-medium text-text-muted\">
                  Designation
                </th>
                <th className=\"px-6 py-3 text-left text-[12px] font-medium text-text-muted\">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className=\"border-b border-border last:border-0\">
                  <td className=\"px-6 py-4\">
                    <div className=\"flex items-center gap-3\">
                      <div className=\"flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[13px] font-medium text-primary-soft\">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className=\"text-[14px] font-medium text-foreground\">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className=\"px-6 py-4 text-[14px] text-text-muted\">
                    {user.email}
                  </td>
                  <td className=\"px-6 py-4\">
                    <span className=\"rounded-full bg-surface-2 px-2 py-1 text-[11px] font-medium text-foreground\">
                      {user.role}
                    </span>
                  </td>
                  <td className=\"px-6 py-4 text-[14px] text-text-muted\">
                    {user.designation || '-'}
                  </td>
                  <td className=\"px-6 py-4\">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                        user.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-2 text-text-muted'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4\">
          <div className=\"w-full max-w-md rounded-xl border border-border bg-surface p-6\">
            <h2 className=\"text-xl font-semibold\">Invite Team Member</h2>
            <form onSubmit={handleInvite} className=\"mt-6 space-y-4\">
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Name
                </label>
                <input
                  type=\"text\"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Email
                </label>
                <input
                  type=\"email\"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                >
                  <option value=\"DEVELOPER\">Developer</option>
                  <option value=\"MANAGER\">Manager</option>
                  <option value=\"ADMIN\">Admin</option>
                  <option value=\"VIEWER\">Viewer</option>
                </select>
              </div>
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Designation (Optional)
                </label>
                <input
                  type=\"text\"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder=\"Senior Engineer\"
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div className=\"flex gap-3\">
                <button
                  type=\"button\"
                  onClick={() => setShowInviteModal(false)}
                  className=\"flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface\"
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  disabled={inviting}
                  className=\"flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50\"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
