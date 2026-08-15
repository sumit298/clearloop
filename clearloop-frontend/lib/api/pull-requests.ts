import apiClient from './client';

export interface PullRequest {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  githubPrId: string;
  githubPrUrl: string;
  githubPrNumber?: number;
  isDraft?: boolean;
  author: string;
  authorGithubLogin?: string;
  branchName?: string;
  baseBranch?: string;
  headBranch?: string;
  githubCreatedAt?: string;
  mergedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  featureId?: string;
  aiStatus?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  aiSummary?: string;
  aiRisk?: string;
  // Relations
  feature?: {
    id: string;
    title: string;
    status: string;
    project?: {
      id: string;
      name: string;
    };
  };
  repository?: {
    id: string;
    fullName: string;
  };
}

export interface LinkPRData {
  featureId: string;
}

export const pullRequestsApi = {
  // Get all pull requests
  getAll: async (featureId?: string): Promise<PullRequest[]> => {
    const params = featureId ? { featureId } : {};
    const response = await apiClient.get('/github/pull-requests', { params });
    return response.data;
  },

  // Get single pull request
  getById: async (id: string): Promise<PullRequest> => {
    const response = await apiClient.get(`/github/pull-requests/${id}`);
    return response.data;
  },

  // Manually link PR to feature
  linkToFeature: async (prId: string, featureId: string): Promise<void> => {
    await apiClient.post(`/github/pull-requests/${prId}/link`, { featureId });
  },

  // Manually unlink PR from feature
  unlinkFromFeature: async (prId: string): Promise<void> => {
    await apiClient.post(`/github/pull-requests/${prId}/unlink`);
  },
};
