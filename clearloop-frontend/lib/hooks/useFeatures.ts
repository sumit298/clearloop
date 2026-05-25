import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi, CreateFeatureData, UpdateFeatureData } from '../api/features';

export function useFeatures(projectId?: string) {
  return useQuery({
    queryKey: projectId ? ['features', { projectId }] : ['features'],
    queryFn: () => featuresApi.getAll(projectId),
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ['features', id],
    queryFn: () => featuresApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeatureData) => featuresApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureData }) =>
      featuresApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['features', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => featuresApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
    },
  });
}
