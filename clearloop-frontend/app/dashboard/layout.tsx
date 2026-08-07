"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { CommandPalette } from "@/components/clearloop/CommandPalette";
import {
  Bug,
  CircleDot,
  Command,
  FolderGit2,
  GitPullRequest,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Plus,
  Rocket,
  Search,
  Settings,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid, exact: true },
  { name: "Projects", href: "/dashboard/projects", icon: FolderGit2 },
  { name: "Features", href: "/dashboard/features", icon: CircleDot },
  { name: "Bugs", href: "/dashboard/bugs", icon: Bug },
  {
    name: "Pull Requests",
    href: "/dashboard/pull-requests",
    icon: GitPullRequest,
  },
  { name: "Releases", href: "/dashboard/releases", icon: Tag },
];

const secondaryNavigation = [
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("clearloop-sidebar") === "collapsed",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "clearloop-sidebar",
        next ? "collapsed" : "expanded",
      );
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] transition-[width] duration-200 md:flex ${collapsed ? "w-[60px]" : "w-[232px]"}`}
        >
          <div
            className={`flex h-14 items-center gap-2 px-3 ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex size-[22px] items-center justify-center rounded-md border border-border bg-primary text-primary-foreground">
                <Rocket className="size-3" strokeWidth={2.5} />
              </span>
              {!collapsed && (
                <span className="text-[14px] font-semibold tracking-tight">
                  ClearLoop
                </span>
              )}
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
            {!collapsed && (
              <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Workspace
              </div>
            )}
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.exact
                  ? pathname === item.href
                  : pathname === item.href) ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${
                    isActive
                      ? "bg-[var(--sidebar-accent)] text-foreground"
                      : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <Icon
                    className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                  />
                  {!collapsed && item.name}
                </Link>
              );
            })}
            <div className="my-3 h-px bg-[var(--sidebar-border)]" />
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${isActive ? "bg-[var(--sidebar-accent)] text-foreground" : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-foreground"}`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                  />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-3">
            <button
              onClick={toggleSidebar}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground transition-colors hover:bg-[var(--sidebar-accent)] hover:text-foreground ${collapsed ? "justify-center px-0" : ""}`}
            >
              <PanelLeft className="size-4" />
              {!collapsed && "Collapse"}
            </button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md">
            <button onClick={toggleSidebar} className="md:hidden">
              <Menu className="size-4" />
            </button>
            <WorkspaceSwitcher compact />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group flex h-8 min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-border-strong"
              aria-label="Search or jump to"
            >
              <Search className="size-3.5" />
              <span className="truncate">Search or jump to…</span>
              <kbd className="ml-auto hidden rounded border border-border bg-[var(--surface-raised)] px-1.5 py-0.5 font-mono text-[10px] sm:flex sm:items-center sm:gap-0.5">
                <Command className="size-2.5" />K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-[var(--surface-raised)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground"
              >
                <Plus className="size-3.5" />{" "}
                <span className="hidden sm:inline">New</span>
              </button>
              <div className="relative ml-1">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex size-7 items-center justify-center rounded-full border border-border bg-[var(--surface-raised)] text-[11px] font-medium text-primary"
                  aria-expanded={profileOpen}
                  aria-label="Open account menu"
                >
                  {user?.name?.slice(0, 2).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-md border border-border bg-[var(--popover)] p-1 shadow-lg">
                    <div className="border-b border-border px-3 py-2">
                      <div className="text-[13px] font-medium">
                        {user?.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {user?.email}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="mt-1 flex items-center gap-2 rounded px-2 py-2 text-[13px] hover:bg-[var(--surface-raised)]"
                    >
                      <Settings className="size-3.5" />
                      Workspace settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[13px] hover:bg-[var(--surface-raised)]"
                    >
                      <LogOut className="size-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </ProtectedRoute>
  );
}
