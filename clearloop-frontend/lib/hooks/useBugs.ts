import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bugsApi, CreateBugReportData, UpdateBugReportData } from '../api/bugs';

export function useBugs(featureId?: string) {
  return useQuery({
    queryKey: featureId ? ['bugs', { featureId }] : ['bugs'],
    queryFn: () => bugsApi.getAll(featureId),
  });
}

export function useBug(id: string) {
  return useQuery({
    queryKey: ['bugs', id],
    queryFn: () => bugsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBugReportData) => bugsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

export function useUpdateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBugReportData }) =>
      bugsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['bugs', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

export function useDeleteBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bugsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
