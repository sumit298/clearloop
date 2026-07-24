import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: {
    userId: string;
    memberId: string;
    tenantId: string;
    role: string;
  };
}