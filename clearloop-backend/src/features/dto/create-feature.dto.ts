import { FeatureStatus, FeaturePriority } from "@prisma/client";

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