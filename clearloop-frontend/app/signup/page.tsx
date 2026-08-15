"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { PasswordField } from "@/components/auth/PasswordField";
import { FormError } from "@/components/auth/FormError";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/contexts/AuthContext";

const API_BASE = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

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

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
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
    } catch (signUpError) {
      // Surfaces the real reason — "an account with this email already exists"
      // is the common one and the user can act on it.
      setError(
        getErrorMessage(
          signUpError,
          "Unable to create your workspace. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-90">
            <Logo className="[&>span+span]:hidden" />
            <h1 className="mt-6 text-[24px] font-semibold leading-tight">Create your workspace</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Connect a repo, invite your team, and the loop starts filling itself in.
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE()}/auth/github`; }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
              >
                <GitBranch className="size-4" />
                Sign up with GitHub
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE()}/auth/google`; }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-surface-raised"
              >
                <GoogleIcon />
                Sign up with Google
              </button>
            </div>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {(
                [
                  ["companyName", "Company name", "Acme Inc", "text"],
                  ["name", "Full name", "Jane Doe", "text"],
                  ["email", "Work email", "you@company.com", "email"],
                ] as const
              ).map(([key, label, placeholder, type]) => (
                <label key={key} className="block text-[12px] font-medium">
                  {label}
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    placeholder={placeholder}
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
                  />
                </label>
              ))}
              <PasswordField
                label="Password"
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
              />
              <FormError message={error} />

              <button
                disabled={loading}
                className="mt-1 h-10 w-full rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-surface-raised disabled:opacity-50"
              >
                {loading ? "Creating workspace…" : "Continue with email"}
              </button>
            </form>

            <p className="mt-6 text-[12px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="relative flex h-full items-center px-12">
          <div>
            <div className="font-mono text-[12px] text-primary">the loop starts here</div>
            <h2 className="mt-3 max-w-sm text-[24px] font-semibold leading-tight">
              Connect your repo. Keep product and code in the same conversation.
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Features, bugs, pull requests and releases are ready when your workspace is.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
