import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { githubApi } from "../api/github";

export function useGitHubInstallation() {
  return useQuery({
    queryKey: ["github", "installation"],
    queryFn: githubApi.getInstallation,
  });
}

export function useDisconnectGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (installationId: string) =>
      githubApi.disconnectGitHub(installationId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github", "installation"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useConnectRepositoryToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repositoryId, projectId}: { repositoryId: string; projectId: string}) => githubApi.connectRepositoryToProject(      repositoryId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github", "installation"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  })
}
