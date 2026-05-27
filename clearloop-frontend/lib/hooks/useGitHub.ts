import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '../api/github';

export function useGitHubInstallation() {
  return useQuery({
    queryKey: ['github', 'installation'],
    queryFn: githubApi.getInstallation,
  });
}

export function useDisconnectGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: githubApi.disconnectGitHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github', 'installation'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
