import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    // Add other user properties
  };
}