import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi, UpdateWorkspaceData } from '../api/workspace';

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: workspaceApi.getCurrent,
  });
}

export function useWorkspaceStats() {
  return useQuery({
    queryKey: ['workspace', 'stats'],
    queryFn: workspaceApi.getStats,
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkspaceData) => workspaceApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}
