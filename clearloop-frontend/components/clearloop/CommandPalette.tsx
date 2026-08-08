"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, CircleDot, FolderGit2, GitPullRequest, LayoutGrid, Plus, Rocket, Search, Settings, Tag, Users } from "lucide-react";
import { useBugs } from "@/lib/hooks/useBugs";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useProjects } from "@/lib/hooks/useProjects";
import { usePullRequests } from "@/lib/hooks/usePullRequests";
import { useReleases } from "@/lib/hooks/useReleases";

type PaletteItem = { label: string; detail: string; href: string; icon: typeof Search };

const navigation: PaletteItem[] = [
  { label: "Overview", detail: "Go to workspace overview", href: "/dashboard", icon: LayoutGrid },
  { label: "Projects", detail: "Browse projects", href: "/dashboard/projects", icon: FolderGit2 },
  { label: "Features", detail: "Browse features", href: "/dashboard/features", icon: CircleDot },
  { label: "Bugs", detail: "Browse bug reports", href: "/dashboard/bugs", icon: Bug },
  { label: "Pull requests", detail: "Browse pull requests", href: "/dashboard/pull-requests", icon: GitPullRequest },
  { label: "Releases", detail: "Browse releases", href: "/dashboard/releases", icon: Tag },
  { label: "Team", detail: "Manage workspace members", href: "/dashboard/team", icon: Users },
  { label: "Settings", detail: "Workspace preferences", href: "/dashboard/settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter(); const inputRef = useRef<HTMLInputElement>(null); const [query, setQuery] = useState(""); const [everOpened, setEverOpened] = useState(false);
  const { data: features } = useFeatures(); const { data: bugs } = useBugs(); const { data: projects } = useProjects(); const { data: pullRequests } = usePullRequests(); const { data: releases } = useReleases();
  useEffect(() => { if (open) setEverOpened(true); }, [open]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onOpenChange(!open); } if (event.key === "Escape") onOpenChange(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onOpenChange, open]);
  useEffect(() => { if (open) { setQuery(""); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);
  const items = useMemo(() => {
    if (!everOpened) return navigation;
    const entityItems: PaletteItem[] = [
      ...(features || []).map((item) => ({ label: item.title, detail: `Feature · ${item.status.replace("_", " ")}`, href: `/dashboard/features/${item.id}`, icon: CircleDot })),
      ...(bugs || []).map((item) => ({ label: item.title, detail: `Bug · ${item.status.replace("_", " ")}`, href: `/dashboard/bugs/${item.id}`, icon: Bug })),
      ...(projects || []).map((item) => ({ label: item.name, detail: "Project", href: `/dashboard/projects/${item.id}`, icon: FolderGit2 })),
      ...(pullRequests || []).map((item) => ({ label: item.title, detail: `Pull request · ${item.status}`, href: "/dashboard/pull-requests", icon: GitPullRequest })),
      ...(releases || []).map((item) => ({ label: item.title || item.version, detail: `Release · ${item.version}`, href: `/dashboard/releases/${item.id}`, icon: Tag })),
    ];
    const all = query.trim() ? entityItems.concat(navigation) : navigation;
    const needle = query.toLowerCase().trim(); return needle ? all.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(needle)).slice(0, 12) : all;
  }, [bugs, features, projects, pullRequests, query, releases]);
  const go = (href: string) => { router.push(href); onOpenChange(false); };
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => onOpenChange(false)}><div role="dialog" aria-modal="true" aria-label="Search or jump to" className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-[var(--popover)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-2 border-b border-border px-3"><Search className="size-4 text-muted-foreground" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search or jump to…" className="h-12 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground" /><kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd></div>{!query && <div className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Navigation</div>}<div className="max-h-[55vh] overflow-y-auto p-2">{query === "" && <button onClick={() => go("/dashboard/features?create=1")} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-[var(--surface-raised)]"><span className="flex size-7 items-center justify-center rounded border border-border"><Plus className="size-3.5 text-primary" /></span><span className="flex-1 text-[13px]">New feature</span><span className="text-[11px] text-muted-foreground">Create</span></button>}{items.map((item) => { const Icon = item.icon; return <button key={`${item.href}-${item.label}`} onClick={() => go(item.href)} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-[var(--surface-raised)]"><Icon className="size-4 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{item.label}</span><span className="block truncate text-[11px] text-muted-foreground">{item.detail}</span></span></button>; })}{items.length === 0 && <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">No matching features, bugs, projects, pull requests, or releases.</div>}</div><div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[10px] text-muted-foreground"><span><kbd className="rounded border border-border px-1">↵</kbd> open</span><span><kbd className="rounded border border-border px-1">⌘K</kbd> toggle</span><span className="ml-auto flex items-center gap-1"><Rocket className="size-3" />ClearLoop</span></div></div></div>;
}
