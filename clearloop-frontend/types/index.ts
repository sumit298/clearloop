export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export enum FeatureStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum FeaturePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PullRequestStatus {
  OPEN = 'OPEN',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
}

export enum BugSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum BugStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  designation?: string;
  githubUsername?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  githubRepoUrl?: string;
  githubRepoId?: string;
  githubInstallationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description?: string;
  reason?: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  createdById: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  createdBy?: User;
  assignedTo?: User;
  pullRequests?: PullRequest[];
}

export interface PullRequest {
  id: string;
  tenantId: string;
  featureId?: string;
  title: string;
  description?: string;
  status: PullRequestStatus;
  githubPrId: string;
  githubPrUrl: string;
  author: string;
  branchName?: string;
  aiSummary?: string;
  mergedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BugReport {
  id: string;
  tenantId: string;
  featureId?: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  reportedById: string;
  createdAt: string;
  updatedAt: string;
  feature?: Feature;
  reportedBy?: User;
}

export interface Release {
  id: string;
  tenantId: string;
  version: string;
  title: string;
  description?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  tenant: Tenant;
}

export interface RegisterDto {
  companyName: string;
  slug: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  githubRepoUrl?: string;
}

export interface CreateFeatureDto {
  title: string;
  description?: string;
  reason?: string;
  projectId: string;
  priority?: FeaturePriority;
  assignedToId?: string;
}

export interface UpdateFeatureDto {
  title?: string;
  description?: string;
  reason?: string;
  status?: FeatureStatus;
  priority?: FeaturePriority;
  assignedToId?: string;
}
