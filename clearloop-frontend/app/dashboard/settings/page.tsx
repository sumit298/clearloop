"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  GitBranch,
  KeyRound,
  Palette,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { PageHeader, Section } from "@/components/clearloop/primitives";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { useWorkspace, useUpdateWorkspace } from "@/lib/hooks/useWorkspace";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  useDisconnectGitHub,
  useGitHubInstallation,
} from "@/lib/hooks/useGitHub";
import { githubApi } from "@/lib/api/github";

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: githubInstallation } = useGitHubInstallation();
  const disconnectGitHub = useDisconnectGitHub();
  const updateWorkspace = useUpdateWorkspace();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = user?.role === "ADMIN";
  const connectionMessage =
    searchParams.get("github") === "connected"
      ? "GitHub App connected successfully."
      : searchParams.get("github") === "error"
        ? "GitHub connection was not completed."
        : "";
  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateWorkspace.mutateAsync({ name });
      setName("");
      setMessage("Workspace name updated.");
    } catch {
      setMessage("Unable to update the workspace name.");
    }
  };
  const disconnect = async (id: string) => {
    if (
      !window.confirm(
        "Disconnect GitHub? Pull requests will stop syncing automatically.",
      )
    )
      return;
    try {
      await disconnectGitHub.mutateAsync(id);
      setMessage("GitHub App disconnected.");
    } catch {
      setMessage("Unable to disconnect GitHub.");
    }
  };
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
        Loading settings…
      </div>
    );
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Everything about how this workspace talks to GitHub and to you."
      />
      {(message || connectionMessage) && (
        <div className="border-b border-border bg-surface-raised px-6 py-2 text-[12px] text-muted-foreground">
          {message || connectionMessage}
        </div>
      )}
      <div className="flex max-w-4xl flex-col gap-4 p-6">
        <Section title="General" icon={Palette}>
          <div className="border-b border-border px-4 py-3.5">
            <label
              htmlFor="workspace-name"
              className="text-[12px] font-medium text-muted-foreground"
            >
              Workspace name
            </label>
            <form onSubmit={saveName} className="mt-1.5 flex max-w-sm gap-2">
              <input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={workspace?.name}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary"
              />
              <button
                disabled={!name || updateWorkspace.isPending || !isAdmin}
                className="rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
              >
                Save
              </button>
            </form>
          </div>
          <SettingRow
            title="Appearance"
            description="Dark is the default. Light mode uses the same contrast rules."
          >
            <button
              onClick={toggleTheme}
              className="h-8 w-24 rounded-md border border-border text-[12px] font-medium hover:bg-(--surface-raised)"
            >
              {theme === "dark" ? "Dark" : "Light"}
            </button>
          </SettingRow>
          <SettingRow
            title="Keyboard shortcuts"
            description="Open command search with ⌘K from any dashboard page."
          >
            <kbd className="rounded border border-border bg-(--surface-raised) px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </kbd>
          </SettingRow>
        </Section>
        <Section
          title="GitHub App"
          icon={GitBranch}
          action={
            githubInstallation?.connected ? (
              <button
                onClick={githubApi.connectGitHub}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3" />
                Re-sync all
              </button>
            ) : undefined
          }
        >
          {!githubInstallation?.connected ? (
            <div className="p-4">
              <p className="text-[13px] text-muted-foreground">
                Connect the GitHub App once and ClearLoop will mirror pull
                requests from selected repositories.
              </p>
              <button
                onClick={githubApi.connectGitHub}
                className="mt-4 h-9 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground"
              >
                Connect GitHub App
              </button>
            </div>
          ) : (
            <div>
              {(githubInstallation.installations ?? []).map((installation) => (
                <div
                  key={installation.id}
                  className="border-b border-border p-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">
                        {installation.accountLogin || "GitHub App"}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {installation.repositories.length} connected
                        repositories
                      </div>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Healthy
                    </span>
                  </div>
                  {installation.repositories.map((repository) => (
                    <div
                      key={repository.id}
                      className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2 text-[12px]"
                    >
                      <span className="font-mono">{repository.fullName}</span>
                      <span className="text-muted-foreground">
                        {repository.projectId ? "Mirroring" : "Not linked"}
                      </span>
                    </div>
                  ))}
                  {isAdmin && (
                    <button
                      disabled={disconnectGitHub.isPending}
                      onClick={() => disconnect(installation.id)}
                      className="mt-3 text-[12px] text-destructive hover:underline"
                    >
                      Disconnect GitHub App
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
        <Section title="Notifications" icon={Bell}>
          <SettingRow
            title="Review requests"
            description="When someone requests your review on a mirrored pull request."
          >
            <span className="rounded-full bg-surface-raised px-2 py-1 text-[11px] text-muted-foreground">
              Coming soon
            </span>
          </SettingRow>
          <SettingRow
            title="Daily digest"
            description="A morning summary of overdue features and unresolved bugs."
          >
            <span className="rounded-full bg-surface-raised px-2 py-1 text-[11px] text-muted-foreground">
              Coming soon
            </span>
          </SettingRow>
        </Section>
        <Section title="API tokens" icon={KeyRound}>
          <SettingRow
            title="CI token"
            description="Use the API to connect your existing engineering workflows."
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              Not configured
            </span>
          </SettingRow>
        </Section>
        {isAdmin && (
          <Section title="Danger zone" icon={Trash2}>
            <SettingRow
              title="Delete workspace"
              description="Deleting a workspace is irreversible and removes its projects and synced data."
            >
              <button
                className="h-8 rounded-md border border-destructive/40 px-3 text-[12px] text-destructive"
                onClick={() =>
                  setMessage(
                    "Workspace deletion is not available from this version of the API.",
                  )
                }
              >
                Delete
              </button>
            </SettingRow>
          </Section>
        )}
      </div>
    </>
  );
}
