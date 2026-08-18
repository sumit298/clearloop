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

export interface InvitationPreview extends Invitation {
  tenant: { id: string; name: string; slug: string };
  /** Whether a ClearLoop account already exists for the invited email. */
  userExists: boolean;
  /**
   * How that existing account signs in. 'password' means they must enter their
   * current password to join; 'oauth' means the password flow is rejected;
   * null when there is no account yet.
   */
  authMethod: 'password' | 'oauth' | null;
}

export interface AcceptInvitationResponse {
  access_token: string;
  user: { id: string; email: string; name: string | null };
  tenant: { id: string; name: string; slug: string };
  member: { id: string; role: Invitation['role'] };
}

export const invitationsApi = {
  // Look up an invitation by its emailed token. Public — no auth header needed.
  validate: async (token: string): Promise<InvitationPreview> => {
    const response = await apiClient.get(
      `/invitations/validate/${encodeURIComponent(token)}`,
    );
    return response.data;
  },

  // Accept and receive a signed-in session for the new workspace.
  accept: async (
    token: string,
    data: { name: string; password: string },
  ): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post(
      `/invitations/accept/${encodeURIComponent(token)}`,
      data,
    );
    return response.data;
  },

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
