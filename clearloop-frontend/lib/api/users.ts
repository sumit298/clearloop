import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';
  designation?: string;
  githubUsername?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  role?: string;
  designation?: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  role?: string;
  designation?: string;
  githubUsername?: string;
}

export const usersApi = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Get single user
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  // Update current user
  updateMe: async (data: UpdateUserData): Promise<User> => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  // Deactivate user
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}/deactivate`);
  },

  // Reactivate user
  reactivate: async (id: string): Promise<void> => {
    await apiClient.post(`/users/${id}/reactivate`);
  },
};
