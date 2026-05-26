"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function SignIn() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });

      // Check if user belongs to multiple workspaces
      if (response.requiresWorkspaceSelection && response.workspaces) {
        setWorkspaces(response.workspaces);
        setLoading(false);
        return;
      }

      // Single workspace - login directly
      await authLogin(response.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to sign in",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSelect = async (workspace: {
    id: string;
    name: string;
    slug: string;
  }) => {
    setLoading(true);
    try {
      // For now, just use the first workspace's token
      // In production, you'd need a separate endpoint to get token for selected workspace
      await authLogin(workspace.id); // This needs backend support
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to select workspace");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col lg:w-[45%]">
        {/* Header */}
        <header className="border-b border-border">
          <div className="flex h-16 items-center px-8">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-[380px]">
            {workspaces.length > 0 ? (
              // Workspace selection
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Select workspace
                </h1>
                <p className="mt-2 text-[15px] text-text-dim">
                  You belong to multiple workspaces
                </p>
                <div className="mt-8 space-y-3">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary-soft/40 hover:bg-surface-2"
                    >
                      <div className="font-medium text-foreground">
                        {workspace.name}
                      </div>
                      <div className="text-[13px] text-text-muted">
                        {workspace.slug}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setWorkspaces([])}
                  className="mt-6 text-[13px] text-text-dim hover:text-foreground"
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              // Login form
              <div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-[15px] text-text-dim">
                    Sign in to continue to ClearLoop
                  </p>
                </div>

                <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[13px] font-medium text-foreground"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-2 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-text-muted focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-[13px] font-medium text-foreground"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[13px] text-primary-soft transition-colors hover:text-primary-hover"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-2 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-text-muted focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-foreground transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <div className="relative mt-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[12px]">
                    <span className="bg-background px-3 text-text-muted">
                      Or
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                  <button 
                    type="button"
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                </div>

                <p className="mt-10 text-center text-[13px] text-text-muted">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-foreground transition-colors hover:text-primary-soft"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-[55%] lg:flex-col">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden border-l border-border bg-gradient-to-br from-surface via-background to-background p-16">
          {/* Animated circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-primary-soft/5 blur-3xl" />
          </div>

          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

          {/* Floating elements */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
            {/* Center logo */}
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-primary-soft/20 bg-surface/50 backdrop-blur-xl">
              <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="8.5"
                  stroke="#B1A3FA"
                  strokeWidth="1.5"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="5"
                  stroke="#8739D5"
                  strokeWidth="1.5"
                />
                <circle cx="10" cy="10" r="2" fill="#554091" />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Engineering context,
                <br />
                finally connected.
              </h2>
              <p className="mt-3 text-[14px] text-text-dim">
                Track features, PRs, releases, and incidents in one timeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
