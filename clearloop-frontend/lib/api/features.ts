import apiClient from './client';

export interface Feature {
  id: string;
  title: string;
  description?: string;
  reason?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: string;
  createdById: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  project?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  // Detail page relations
  pullRequests?: Array<{
    id: string;
    title: string;
    status: 'OPEN' | 'MERGED' | 'CLOSED';
    githubPrUrl: string;
    author: string;
    createdAt: string;
  }>;
  bugReports?: Array<{
    id: string;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  activityLogs?: Array<{
    id: string;
    action: string;
    metadata?: any;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface CreateFeatureData {
  title: string;
  description?: string;
  reason?: string;
  status?: string;
  priority?: string;
  projectId: string;
  assignedToId?: string;
}

export interface UpdateFeatureData {
  title?: string;
  description?: string;
  reason?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
}

export const featuresApi = {
  // Get all features
  getAll: async (projectId?: string): Promise<Feature[]> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get('/features', { params });
    return response.data;
  },

  // Get single feature
  getById: async (id: string): Promise<Feature> => {
    const response = await apiClient.get(`/features/${id}`);
    return response.data;
  },

  // Create feature
  create: async (data: CreateFeatureData): Promise<Feature> => {
    const response = await apiClient.post('/features', data);
    return response.data;
  },

  // Update feature
  update: async (id: string, data: UpdateFeatureData): Promise<Feature> => {
    const response = await apiClient.patch(`/features/${id}`, data);
    return response.data;
  },

  // Delete feature
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/features/${id}`);
  },
};
