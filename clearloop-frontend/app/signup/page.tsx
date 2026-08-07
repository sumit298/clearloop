"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await authApi.register(form);
      await login(response.access_token);
      router.push("/dashboard");
    } catch {
      setError("Unable to create your workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-[13px] text-text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-90">
            <Logo className="[&>span+span]:hidden" />
            <h1 className="mt-6 text-[24px] font-semibold leading-tight">
              Create your workspace
            </h1>
            <p className="mt-2 text-[13px] text-text-muted">
              Connect a repo, invite your team, and the loop starts filling
              itself in.
            </p>
            <button
              type="button"
              onClick={() => {
                const base =
                  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
                  "http://localhost:8000";
                window.location.href = `${base}/auth/github`;
              }}
              className="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
            >
              <GitBranch className="size-4" />
              Sign up with GitHub
            </button>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                or email
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={submit} className="space-y-3">
              {error && (
                <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {error}
                </div>
              )}
              {(
                [
                  ["companyName", "Company name", "Acme Inc", "text"],
                  ["name", "Full name", "Jane Doe", "text"],
                  ["email", "Work email", "you@company.com", "email"],
                  ["password", "Password", "At least 8 characters", "password"],
                ] as const
              ).map(([key, label, placeholder, type]) => (
                <label key={key} className="block text-[12px] font-medium">
                  {label}
                  <input
                    type={type}
                    required
                    minLength={key === "password" ? 8 : undefined}
                    value={form[key]}
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                    placeholder={placeholder}
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
                  />
                </label>
              ))}
              <button
                disabled={loading}
                className="mt-1 h-10 w-full rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-(--surface-raised) disabled:opacity-50"
              >
                {loading ? "Creating workspace…" : "Continue with email"}
              </button>
            </form>
            <p className="mt-6 text-[12px] text-text-muted">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="relative flex h-full items-center px-12">
          <div>
            <div className="font-mono text-[12px] text-primary">
              the loop starts here
            </div>
            <h2 className="mt-3 max-w-sm text-[24px] font-semibold leading-tight">
              Connect your repo. Keep product and code in the same conversation.
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-text-muted">
              Features, bugs, pull requests and releases are ready when your
              workspace is.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
