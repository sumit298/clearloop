"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { FormError } from "@/components/auth/FormError";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to send the reset link. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? "If an account exists for that email, a reset link is on its way. The link expires in 1 hour."
          : "Enter the email you sign in with and we will send you a link to set a new password."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/signin" className="text-primary hover:underline">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 text-[13px]">
              <p className="font-medium">Reset link sent</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                We sent it to <span className="font-mono">{email}</span>. Check
                your spam folder if it does not arrive in a few minutes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setSent(false); setError(""); }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-[13px] font-medium hover:bg-surface-raised"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={requestReset}>
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

          <FormError message={error} />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground disabled:opacity-50"
          >
            <Mail className="size-4" />
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}
