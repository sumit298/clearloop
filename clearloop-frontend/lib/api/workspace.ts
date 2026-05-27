import apiClient from './client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  projects: {
    total: number;
  };
  features: {
    total: number;
    byStatus: Record<string, number>;
  };
  bugs: {
    total: number;
    byStatus: Record<string, number>;
  };
  releases: {
    total: number;
  };
}

export interface UpdateWorkspaceData {
  name?: string;
  plan?: string;
}

export const workspaceApi = {
  // Get current workspace
  getCurrent: async (): Promise<Workspace> => {
    const response = await apiClient.get('/workspace');
    return response.data;
  },

  // Update workspace (ADMIN only)
  update: async (data: UpdateWorkspaceData): Promise<Workspace> => {
    const response = await apiClient.patch('/workspace', data);
    return response.data;
  },

  // Get workspace statistics
  getStats: async (): Promise<WorkspaceStats> => {
    const response = await apiClient.get('/workspace/stats');
    return response.data;
  },
};
