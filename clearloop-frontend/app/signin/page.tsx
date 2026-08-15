"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordField } from "@/components/auth/PasswordField";
import { FormError } from "@/components/auth/FormError";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/contexts/AuthContext";

type WorkspaceOption = { id: string; name: string; slug: string };

const API_BASE = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

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
      if (response.requiresWorkspaceSelection && response.workspaces && response.sessionToken) {
        setWorkspaces(response.workspaces);
        setSessionToken(response.sessionToken);
        return;
      }
      await login(response.access_token);
      router.push("/dashboard");
    } catch (signInError) {
      // The backend answers wrong-email and wrong-password identically
      // ("Invalid credentials"), so passing its message through leaks nothing.
      setError(
        getErrorMessage(
          signInError,
          "Unable to sign in. Check your email and password, then try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const chooseWorkspace = async (workspace: WorkspaceOption) => {
    setLoading(true);
    setError("");
    try {
      const response = await authApi.selectWorkspace(sessionToken, workspace.id);
      await login(response.access_token);
      router.push("/dashboard");
    } catch (selectError) {
      setError(
        getErrorMessage(
          selectError,
          "Unable to select this workspace. Please try again.",
        ),
      );
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
          <button onClick={() => setWorkspaces([])} className="text-primary hover:underline">
            Back to sign in
          </button>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="text-primary hover:underline">Create one</Link>
          </>
        )
      }
    >
      {workspaces.length ? (
        <>
          <div className="mb-4">
            <FormError message={error} />
          </div>
          <div className="panel overflow-hidden">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                disabled={loading}
                onClick={() => chooseWorkspace(workspace)}
                className="row-hover flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 disabled:opacity-50"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-[14px] font-bold text-primary">
                  {workspace.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{workspace.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">clearloop.app/{workspace.slug}</span>
                </span>
                <span className="text-muted-foreground">→</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <form className="space-y-4" onSubmit={signIn}>
          <button
            type="button"
            onClick={() => { window.location.href = `${API_BASE()}/auth/github`; }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
          >
            <GitBranch className="size-4" />
            Sign in with GitHub
          </button>

          <button
            type="button"
            onClick={() => { window.location.href = `${API_BASE()}/auth/google`; }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-surface-raised"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or email</span>
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

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            labelAction={
              <Link href="/forgot-password" className="font-normal text-primary hover:underline">
                Forgot password?
              </Link>
            }
          />

          <FormError message={error} />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-surface-raised disabled:opacity-50"
          >
            <Mail className="size-4" />
            {loading ? "Signing in…" : "Continue with email"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
