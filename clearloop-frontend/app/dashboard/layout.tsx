'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/landing/Logo';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: '◆' },
  { name: 'Projects', href: '/dashboard/projects', icon: '▣' },
  { name: 'Features', href: '/dashboard/features', icon: '◉' },
  { name: 'Bugs', href: '/dashboard/bugs', icon: '◈' },
  { name: 'Pull Requests', href: '/dashboard/pull-requests', icon: '⚡' },
  { name: 'Releases', href: '/dashboard/releases', icon: '▲' },
  { name: 'Team', href: '/dashboard/team', icon: '◎' },
  { name: 'Settings', href: '/dashboard/settings', icon: '◐' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ProtectedRoute>
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-64 flex-col border-r border-border bg-surface">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo />
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="text-[13px] font-medium text-foreground">{workspace?.name}</div>
          <div className="mt-0.5 text-[11px] text-text-muted">{workspace?.slug}</div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary-soft'
                    : 'text-text-dim hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <span className="text-[16px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[13px] font-medium text-primary-soft">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-[13px] font-medium text-foreground">{user?.name}</div>
              <div className="truncate text-[11px] text-text-muted">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12px] font-medium text-text-dim transition-colors hover:bg-surface hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}
