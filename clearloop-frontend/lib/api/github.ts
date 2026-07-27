import apiClient from "./client";

export interface GitHubInstallation {
  connected: boolean;
  installationId: string | null;
  projects: Array<{
    id: string;
    name: string;
    githubRepoUrl: string;
    githubInstallationId: string;
  }>;
}

export interface GithubRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  projectId: string | null;
  webhookActive: boolean;
}

export interface GithubInstallationRecord {
  id: string;
  githubInstallationId: string;
  accountLogin: string | null;
  status: string;
  repositories: GithubRepository[];
}

export interface GitHubInstallation {
  connected: boolean;
  installations: GithubInstallationRecord[];
}

export const githubApi = {
  // Get installation status
  getInstallation: async (): Promise<GitHubInstallation> => {
    const response = await apiClient.get("/github/installation");
    return response.data;
  },

  // Get GitHub App installation URL
  getInstallUrl: async (): Promise<{
    url: string;
    alreadyInstalled: boolean;
  }> => {
    const response = await apiClient.get("/github/install-url");
    return response.data;
  },

  // Initiate GitHub App installation (redirects to GitHub)
  connectGitHub: async () => {
    const { url } = await githubApi.getInstallUrl();
    window.location.href = url;
  },

  // Disconnect GitHub App
  disconnectGitHub: async (installationId: string): Promise<void> => {
    await apiClient.delete(`/github/installation/${installationId}`);
  },

  // link a repo to a project
  connectRepositoryToProject: async (
    repositoryId: string,
    projectId: string,
  ): Promise<void> => {
    await apiClient.post(`/github/${repositoryId}/connect-project`, {
      projectId,
    });
  },
};
