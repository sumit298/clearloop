"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordField } from "@/components/auth/PasswordField";
import { FormError } from "@/components/auth/FormError";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      // Give the user a beat to read the confirmation before bouncing them.
      setTimeout(() => router.push("/signin"), 2500);
    } catch (resetError) {
      setError(
        getErrorMessage(
          resetError,
          "Unable to reset your password. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthFrame
        title="Reset link is invalid"
        subtitle="This link is missing its token. Reset links only work when opened straight from the email."
        footer={
          <>
            Back to{" "}
            <Link href="/signin" className="text-primary hover:underline">sign in</Link>
          </>
        }
      >
        <Link
          href="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
        >
          Request a new link
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={done ? "Password updated" : "Set a new password"}
      subtitle={
        done
          ? "You are being taken to sign in. Every other session has been signed out."
          : "Choose a new password. This will sign you out of every device."
      }
      footer={
        done ? (
          <Link href="/signin" className="text-primary hover:underline">Go to sign in</Link>
        ) : (
          <>
            Link expired?{" "}
            <Link href="/forgot-password" className="text-primary hover:underline">Request a new one</Link>
          </>
        )
      }
    >
      {done ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 text-[13px]">
            <p className="font-medium">Your password has been changed</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Sign in with your new password to continue.
            </p>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={resetPassword}>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />

          <FormError message={error} />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground disabled:opacity-50"
          >
            <KeyRound className="size-4" />
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}

export default function ResetPassword() {
  // useSearchParams needs a Suspense boundary to keep the route statically
  // renderable at build time.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
