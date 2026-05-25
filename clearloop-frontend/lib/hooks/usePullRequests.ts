import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pullRequestsApi } from '../api/pull-requests';

export function usePullRequests(featureId?: string) {
  return useQuery({
    queryKey: featureId ? ['pull-requests', { featureId }] : ['pull-requests'],
    queryFn: () => pullRequestsApi.getAll(featureId),
  });
}

export function usePullRequest(id: string) {
  return useQuery({
    queryKey: ['pull-requests', id],
    queryFn: () => pullRequestsApi.getById(id),
    enabled: !!id,
  });
}

export function useLinkPRToFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prId, featureId }: { prId: string; featureId: string }) =>
      pullRequestsApi.linkToFeature(prId, featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-requests'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

export function useUnlinkPRFromFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prId: string) => pullRequestsApi.unlinkFromFeature(prId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-requests'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
