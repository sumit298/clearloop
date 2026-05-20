import type {
  AuthResponse,
  RegisterDto,
  LoginDto,
  User,
  Project,
  CreateProjectDto,
  Feature,
  CreateFeatureDto,
  UpdateFeatureDto,
  PullRequest,
  BugReport,
  Release,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(data: RegisterDto): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(slug: string, data: LoginDto): Promise<AuthResponse> {
    return this.request<AuthResponse>(`/auth/login/${slug}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getMe(token: string): Promise<User> {
    return this.request<User>('/users/me', {}, token);
  }

  async updateMe(token: string, data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  async getUsers(token: string): Promise<User[]> {
    return this.request<User[]>('/users', {}, token);
  }

  async inviteUser(token: string, data: { email: string; name: string; role: string; designation?: string }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  // Projects
  async getProjects(token: string): Promise<Project[]> {
    return this.request<Project[]>('/projects', {}, token);
  }

  async getProject(token: string, id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {}, token);
  }

  async createProject(token: string, data: CreateProjectDto): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateProject(token: string, id: string, data: Partial<CreateProjectDto>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  async deleteProject(token: string, id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    }, token);
  }

  // Features
  async getFeatures(token: string, projectId?: string): Promise<Feature[]> {
    const url = projectId ? `/features?projectId=${projectId}` : '/features';
    return this.request<Feature[]>(url, {}, token);
  }

  async getFeature(token: string, id: string): Promise<Feature> {
    return this.request<Feature>(`/features/${id}`, {}, token);
  }

  async createFeature(token: string, data: CreateFeatureDto): Promise<Feature> {
    return this.request<Feature>('/features', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateFeature(token: string, id: string, data: UpdateFeatureDto): Promise<Feature> {
    return this.request<Feature>(`/features/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  async deleteFeature(token: string, id: string): Promise<void> {
    return this.request<void>(`/features/${id}`, {
      method: 'DELETE',
    }, token);
  }

  // Pull Requests
  async getPullRequests(token: string): Promise<PullRequest[]> {
    return this.request<PullRequest[]>('/github/pull-requests', {}, token);
  }

  // Bug Reports
  async getBugReports(token: string): Promise<BugReport[]> {
    return this.request<BugReport[]>('/bug-reports', {}, token);
  }

  async createBugReport(token: string, data: { title: string; description: string; severity: string; featureId?: string }): Promise<BugReport> {
    return this.request<BugReport>('/bug-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  // Releases
  async getReleases(token: string): Promise<Release[]> {
    return this.request<Release[]>('/releases', {}, token);
  }

  async createRelease(token: string, data: { version: string; title: string; description?: string; featureIds: string[] }): Promise<Release> {
    return this.request<Release>('/releases', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }
}

export const api = new ApiClient();
