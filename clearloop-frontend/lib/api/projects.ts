import apiClient from './client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  githubRepoUrl?: string;
  githubRepoId?: string;
  githubInstallationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  githubRepoUrl?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  githubRepoUrl?: string;
}

export const projectsApi = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  // Get single project
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  // Create project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  // Update project
  update: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Add member to project
  addMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/projects/${id}/members`, { userId });
  },

  // Remove member from project
  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/members/${userId}`);
  },
};
