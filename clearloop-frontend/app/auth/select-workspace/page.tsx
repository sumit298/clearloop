"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";

function SelectWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string; selectionToken: string }>>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const workspacesParam = searchParams.get("workspaces");

    if (!emailParam || !workspacesParam) {
      router.push("/signin?error=Invalid workspace selection");
      return;
    }

    try {
      const parsedWorkspaces = JSON.parse(workspacesParam);

      if (!Array.isArray(parsedWorkspaces)) {
        router.push("/signin?error=Invalid workspace data");
        return;
      }

      setEmail(emailParam);
      setWorkspaces(parsedWorkspaces);
    } catch (err) {
      router.push("/signin?error=Invalid workspace data");
    }
  }, [searchParams, router]);

  const handleSelectWorkspace = async (workspaceId: string) => {
    setLoading(true);
    setError("");

    try {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) {
        setError("Workspace not found");
        return;
      }

      const response = await authApi.selectWorkspace(email, workspaceId, workspace.selectionToken);
      await login(response.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to select workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Select workspace</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            You belong to multiple workspaces
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSelectWorkspace(workspace.id)}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary-soft/40 hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-foreground">{workspace.name}</div>
              <div className="text-[13px] text-text-muted">{workspace.slug}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push("/signin")}
          className="mt-6 w-full text-center text-[13px] text-text-dim hover:text-foreground"
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}

export default function SelectWorkspace() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-text-dim">Loading workspaces...</p>
        </div>
      </div>
    }>
      <SelectWorkspaceContent />
    </Suspense>
  );
}
