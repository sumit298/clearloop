"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { useAuth } from "@/lib/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";

type Workspace = { id: string; name: string; slug: string };

function WorkspaceSelection() {
  const router = useRouter(); const searchParams = useSearchParams(); const { login } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]); const [sessionToken, setSessionToken] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const token = searchParams.get("sessionToken"); const encoded = searchParams.get("workspaces"); if (!token || !encoded) { router.replace("/signin"); return; } try { const parsed: unknown = JSON.parse(encoded); const isWorkspace = (v: unknown): v is Workspace => !!v && typeof v === "object" && typeof (v as Workspace).id === "string" && typeof (v as Workspace).name === "string" && typeof (v as Workspace).slug === "string"; if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isWorkspace)) { router.replace("/signin"); return; } setSessionToken(token); setWorkspaces(parsed); } catch { router.replace("/signin"); } }, [router, searchParams]);
  const select = async (workspace: Workspace) => { setLoading(true); setError(""); try { const response = await authApi.selectWorkspace(sessionToken, workspace.id); await login(response.access_token); router.push("/dashboard"); } catch { setError("Unable to select this workspace. Please try again."); } finally { setLoading(false); } };
  return <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12"><div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:64px_64px]" /><main className="relative w-full max-w-[560px]"><Logo className="[&>span+span]:hidden" /><h1 className="mt-6 text-[24px] font-semibold leading-tight">Choose a workspace</h1><p className="mt-2 text-[13px] text-muted-foreground">You belong to {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}. Projects, features, and releases are scoped to one at a time.</p>{error && <p className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>}<div className="panel mt-8 overflow-hidden">{workspaces.map((workspace) => <button key={workspace.id} disabled={loading} onClick={() => select(workspace)} className="row-hover flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 disabled:opacity-50"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-[14px] font-bold text-primary">{workspace.name[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{workspace.name}</span><span className="font-mono text-[11px] text-muted-foreground">clearloop.app/{workspace.slug}</span></span><span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:flex"><Users className="size-3.5" />Workspace</span><ArrowRight className="size-4 text-muted-foreground" /></button>)}</div><button onClick={() => router.push("/signin")} className="mt-4 text-[12px] text-muted-foreground hover:text-foreground">Use a different account</button></main></div>;
}

export default function SelectWorkspace() { return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[13px] text-muted-foreground">Loading workspaces…</div>}><WorkspaceSelection /></Suspense>; }
