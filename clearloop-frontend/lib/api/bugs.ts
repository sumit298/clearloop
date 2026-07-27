import apiClient from './client';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  featureId?: string;
  projectId?: string;
  reportedById: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  feature?: {
    id: string;
    title: string;
    status?: string;
    project?: {
      id: string;
      name: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  reportedBy?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface CreateBugReportData {
  title: string;
  description: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  featureId?: string;
  // Required unless featureId is set — the backend derives the project from
  // the feature in that case.
  projectId?: string;
}

export interface UpdateBugReportData {
  title?: string;
  description?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  featureId?: string;
  projectId?: string;
}

export interface BugReportFilters {
  featureId?: string;
  projectId?: string;
}

export const bugsApi = {
  // Get all bug reports
  getAll: async (filters?: BugReportFilters): Promise<BugReport[]> => {
    const response = await apiClient.get('/bug-reports', { params: filters ?? {} });
    return response.data;
  },

  // Get single bug report
  getById: async (id: string): Promise<BugReport> => {
    const response = await apiClient.get(`/bug-reports/${id}`);
    return response.data;
  },

  // Create bug report
  create: async (data: CreateBugReportData): Promise<BugReport> => {
    const response = await apiClient.post('/bug-reports', data);
    return response.data;
  },

  // Update bug report
  update: async (id: string, data: UpdateBugReportData): Promise<BugReport> => {
    const response = await apiClient.patch(`/bug-reports/${id}`, data);
    return response.data;
  },

  // Delete bug report
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bug-reports/${id}`);
  },
};
