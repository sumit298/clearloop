"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, Mail } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

type WorkspaceOption = { id: string; name: string; slug: string };

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (
        response.requiresWorkspaceSelection &&
        response.workspaces &&
        response.sessionToken
      ) {
        setWorkspaces(response.workspaces);
        setSessionToken(response.sessionToken);
        return;
      }
      await login(response.access_token);
      router.push("/dashboard");
    } catch {
      setError(
        "Unable to sign in. Check your email and password, then try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const chooseWorkspace = async (workspace: WorkspaceOption) => {
    setLoading(true);
    setError("");
    try {
      const response = await authApi.selectWorkspace(
        sessionToken,
        workspace.id,
      );
      await login(response.access_token);
      router.push("/dashboard");
    } catch {
      setError("Unable to select this workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title={workspaces.length ? "Choose a workspace" : "Sign in to ClearLoop"}
      subtitle={
        workspaces.length
          ? "Select where you want to continue. Everything is scoped to one workspace at a time."
          : "GitHub is the fastest path — it is how your repos, pull requests, and commits get linked."
      }
      footer={
        workspaces.length ? (
          <button
            onClick={() => setWorkspaces([])}
            className="text-primary hover:underline"
          >
            Back to sign in
          </button>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </>
        )
      }
    >
      {workspaces.length ? (
        <>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
          <div className="panel overflow-hidden">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              disabled={loading}
              onClick={() => chooseWorkspace(workspace)}
              className="row-hover flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-[14px] font-bold text-primary">
                {workspace.name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">
                  {workspace.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  clearloop.app/{workspace.slug}
                </span>
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
          ))}
          </div>
        </>
      ) : (
        <form className="space-y-4" onSubmit={signIn}>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const base =
                process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
                "http://localhost:8000";
              window.location.href = `${base}/auth/github`;
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
          >
            <GitBranch className="size-4" />
            Sign in with GitHub
          </button>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              or email
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <label className="block text-[12px] font-medium">
            Work email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
            />
          </label>
          <label className="block text-[12px] font-medium">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-(--surface-raised) disabled:opacity-50"
          >
            <Mail className="size-4" />
            {loading ? "Signing in…" : "Continue with email"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}

function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-90">
            <Logo className="[&>span+span]:hidden" />
            <h1 className="mt-6 text-[24px] font-semibold leading-tight">
              {title}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-[12px] text-muted-foreground">{footer}</div>
          </div>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="relative flex h-full flex-col justify-center gap-8 px-12">
          <div>
            <div className="font-mono text-[12px] text-primary">
              the loop, today
            </div>
            <p className="mt-3 max-w-sm text-[18px] leading-snug tracking-tight">
              “We deleted our weekly status doc the day we connected the first
              repo.”
            </p>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Miles Cheng · Engineering Manager, Northwind Labs
            </p>
          </div>
          <div className="panel max-w-sm overflow-hidden">
            <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Live activity
            </div>
            {[
              "Merged the GitHub App installation",
              "Linked a pull request to WEB-153",
              "Released version 2.4.0",
              "Created a feature from a customer request",
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 border-b border-border px-4 py-2 text-[12px] last:border-b-0"
              >
                <span className="min-w-0 flex-1 text-muted-foreground">{item}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {index + 1}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
