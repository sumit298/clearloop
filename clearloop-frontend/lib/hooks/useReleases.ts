import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { releasesApi, CreateReleaseData, UpdateReleaseData, GenerateReleaseNotesData } from '../api/releases';

export function useReleases() {
  return useQuery({
    queryKey: ['releases'],
    queryFn: releasesApi.getAll,
  });
}

export function useRelease(id: string) {
  return useQuery({
    queryKey: ['releases', id],
    queryFn: () => releasesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReleaseData) => releasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

export function useUpdateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReleaseData }) =>
      releasesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['releases', variables.id] });
    },
  });
}

export function useDeleteRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => releasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'stats'] });
    },
  });
}

export function useGenerateReleaseNotes() {
  return useMutation({
    mutationFn: (data: GenerateReleaseNotesData) => releasesApi.generateNotes(data),
  });
}
