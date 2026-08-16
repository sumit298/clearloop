"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, LogIn, UserPlus } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { invitationsApi } from "@/lib/api/invitations";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/contexts/AuthContext";

const MIN_PASSWORD_LENGTH = 8;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "an admin",
  MANAGER: "a manager",
  DEVELOPER: "a developer",
  VIEWER: "a viewer",
};

function JoinForm() {
  const router = useRouter();
  const { login } = useAuth();
  const token = useSearchParams().get("token") ?? "";

  const {
    data: invitation,
    isLoading,
    error: lookupError,
  } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => invitationsApi.validate(token),
    enabled: Boolean(token),
    retry: false,
  });

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // The invited person's name is only known once the lookup lands.
  useEffect(() => {
    if (invitation && !name) setName(invitation.email.split("@")[0] ?? "");
  }, [invitation, name]);

  if (!token) {
    return (
      <AuthFrame
        title="This link is incomplete"
        subtitle="Invitation links only work when opened directly from the email."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
          </>
        }
      >
        <Link
          href="/signin"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
        >
          Go to sign in
        </Link>
      </AuthFrame>
    );
  }

  if (isLoading) {
    return (
      <AuthFrame title="Checking your invitation…" subtitle="One moment." footer={null}>
        <div className="h-10 animate-pulse rounded-md bg-surface-raised" />
      </AuthFrame>
    );
  }

  if (lookupError || !invitation) {
    return (
      <AuthFrame
        title="This invitation isn't valid"
        subtitle={getErrorMessage(
          lookupError,
          "It may have expired, been revoked, or already been used.",
        )}
        footer={
          <>
            Already joined?{" "}
            <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3.5 text-[13px]">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-(--hue-amber)" />
          <p className="text-muted-foreground">
            Ask whoever invited you to send a new invitation.
          </p>
        </div>
      </AuthFrame>
    );
  }

  // An OAuth-only account can't complete the password flow — the server
  // rejects it — so offer the route that actually works instead of a form
  // that is guaranteed to fail.
  if (invitation.userExists && invitation.authMethod === "oauth") {
    return (
      <AuthFrame
        title={`Join ${invitation.tenant.name}`}
        subtitle={`${invitation.email} signs in with Google or GitHub, which this invitation flow can't complete yet.`}
        footer={
          <>
            Need help? Ask whoever invited you to {invitation.tenant.name}.
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3.5 text-[13px]">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-(--hue-amber)" />
            <p className="text-muted-foreground">
              Set a password on your account first, then reopen this invitation
              link and use it to join.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground"
          >
            Set a password
          </Link>
        </div>
      </AuthFrame>
    );
  }

  const isExistingUser = invitation.userExists && invitation.authMethod === "password";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!isExistingUser && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await invitationsApi.accept(token, { name, password });
      await login(result.access_token);
      router.push("/dashboard");
    } catch (acceptError) {
      setError(
        getErrorMessage(acceptError, "Could not accept this invitation."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame
      title={`Join ${invitation.tenant.name}`}
      subtitle={
        isExistingUser
          ? `You already have a ClearLoop account. Confirm your password to join as ${ROLE_LABEL[invitation.role] ?? "a member"}.`
          : `You've been invited as ${ROLE_LABEL[invitation.role] ?? "a member"}. Pick a password and you're in.`
      }
      footer={
        <>
          Wrong account?{" "}
          <Link href="/signin" className="text-primary hover:underline">Sign in instead</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="rounded-md border border-border bg-surface-raised px-3 py-2 text-[12px]">
          <span className="text-muted-foreground">Joining as </span>
          <span className="font-mono">{invitation.email}</span>
        </div>

        <label className="block text-[12px] font-medium">
          Your name
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
          />
        </label>

        <PasswordField
          label={isExistingUser ? "Your existing password" : "Create a password"}
          value={password}
          onChange={setPassword}
          placeholder={
            isExistingUser ? "The password you already use" : "At least 8 characters"
          }
          autoComplete={isExistingUser ? "current-password" : "new-password"}
          minLength={isExistingUser ? undefined : MIN_PASSWORD_LENGTH}
          labelAction={
            isExistingUser ? (
              <Link href="/forgot-password" className="font-normal text-primary hover:underline">
                Forgot it?
              </Link>
            ) : undefined
          }
        />

        <FormError message={error} />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {isExistingUser ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
          {submitting
            ? "Joining…"
            : isExistingUser
              ? "Confirm and join"
              : "Create account and join"}
        </button>
      </form>
    </AuthFrame>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}
