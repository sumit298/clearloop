import apiClient from './client';

export interface Release {
  id: string;
  version: string;
  title: string;
  description?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  features?: Array<{
    feature: {
      id: string;
      title: string;
      description?: string;
      status: string;
      priority: string;
      project?: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface CreateReleaseData {
  version: string;
  title: string;
  description?: string;
  releasedAt?: string;
  featureIds?: string[];
  useAI?: boolean; // If true, generate notes with AI
}

export interface UpdateReleaseData {
  version?: string;
  title?: string;
  description?: string;
  releasedAt?: string;
}

export interface GenerateReleaseNotesData {
  sinceDate?: string;
}

export const releasesApi = {
  // Get all releases
  getAll: async (): Promise<Release[]> => {
    const response = await apiClient.get('/releases');
    return response.data;
  },

  // Get single release
  getById: async (id: string): Promise<Release> => {
    const response = await apiClient.get(`/releases/${id}`);
    return response.data;
  },

  // Create release
  create: async (data: CreateReleaseData): Promise<Release> => {
    const response = await apiClient.post('/releases', data);
    return response.data;
  },

  // Update release
  update: async (id: string, data: UpdateReleaseData): Promise<Release> => {
    const response = await apiClient.patch(`/releases/${id}`, data);
    return response.data;
  },

  // Delete release
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/releases/${id}`);
  },

  // Add feature to release
  addFeature: async (releaseId: string, featureId: string): Promise<void> => {
    await apiClient.post(`/releases/${releaseId}/features`, { featureId });
  },

  // Remove feature from release
  removeFeature: async (releaseId: string, featureId: string): Promise<void> => {
    await apiClient.delete(`/releases/${releaseId}/features/${featureId}`);
  },

  // Generate release notes with AI
  generateNotes: async (data: GenerateReleaseNotesData): Promise<{ notes: string }> => {
    const response = await apiClient.post('/releases/generate-notes', data);
    return response.data;
  },
};
