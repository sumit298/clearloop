import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";

export function useMyWorkspaces() {
  return useQuery({
    queryKey: ["auth", "my-workspaces"],
    queryFn: authApi.getWorkspaces,
  });
}
