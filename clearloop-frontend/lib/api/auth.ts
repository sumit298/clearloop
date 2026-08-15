import apiClient from "./client";

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  isCurrent: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  requiresWorkspaceSelection?: boolean;
  sessionToken: string;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface MessageResponse {
  message: string;
}

export const authApi = {
  // Register new workspace + admin user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  // Login with email (finds workspace automatically)
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  // Send a password reset link. Response is deliberately generic — the
  // backend does not reveal whether the email has an account.
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  // Consume a reset token and set a new password
  resetPassword: async (
    token: string,
    password: string,
  ): Promise<MessageResponse> => {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  },

  // Get current user info (from JWT token)
  getCurrentUser: async () => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },
  // Select workspace for multi-tenant users
  selectWorkspace: async (
    sessionToken: string,
    workspaceId: string,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/select-workspace", {
      sessionToken,
      workspaceId,
    });
    return response.data;
  },

  getWorkspaces: async (): Promise<WorkspaceSummary[]> => {
    const response = await apiClient.get("/auth/my-workspaces");
    return response.data;
  },

  switchWorkspace: async (tenantId: string): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/switch-workspace", {
      tenantId,
    });
    return response.data;
  },
};
