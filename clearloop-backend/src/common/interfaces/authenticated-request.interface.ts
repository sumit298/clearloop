import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId: string;
  
  user: {
    userId: string;
    email: string;
    role: string;
    // Add other user properties
  };
}