import apiClient from './client';

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  invitedByMemberId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationResponse extends Invitation {
  emailSent: boolean;
}

export interface CreateInvitationData {
  email: string;
  role: Invitation['role'];
}

export const invitationsApi = {
  // List pending invitations
  list: async (): Promise<Invitation[]> => {
    const response = await apiClient.get('/invitations');
    return response.data;
  },

  // Create invitation
  create: async (data: CreateInvitationData): Promise<CreateInvitationResponse> => {
    const response = await apiClient.post('/invitations', data);
    return response.data;
  },

  // Resend invitation
  resend: async (id: string): Promise<Invitation> => {
    const response = await apiClient.post(`/invitations/${id}/resend`);
    return response.data;
  },

  // Cancel invitation
  cancel: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/invitations/${id}`);
    return response.data;
  },
};
