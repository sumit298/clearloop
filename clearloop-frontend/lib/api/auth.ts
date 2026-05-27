import apiClient from './client';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  requiresWorkspaceSelection?: boolean;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export const authApi = {
  // Register new workspace + admin user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login with email (finds workspace automatically)
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Get current user info (from JWT token)
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
