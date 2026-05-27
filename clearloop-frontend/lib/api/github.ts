import apiClient from './client';

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

export const githubApi = {
  // Get installation status
  getInstallation: async (): Promise<GitHubInstallation> => {
    const response = await apiClient.get('/github/installation');
    return response.data;
  },

  // Get GitHub App installation URL
  getInstallUrl: async (): Promise<{ url: string }> => {
    const response = await apiClient.get('/github/install-url');
    return response.data;
  },

  // Initiate GitHub App installation (redirects to GitHub)
  connectGitHub: async () => {
    const { url } = await githubApi.getInstallUrl();
    window.location.href = url;
  },

  // Disconnect GitHub App
  disconnectGitHub: async (): Promise<void> => {
    await apiClient.delete('/github/installation');
  },
};
