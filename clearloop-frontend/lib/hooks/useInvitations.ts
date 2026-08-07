import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi, CreateInvitationData } from '../api/invitations';

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: invitationsApi.list,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvitationData) => invitationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
