import { Request } from 'express';

export interface AuthUser {
  id: string;
  orgId: string;
  role: string;
  isApiKey?: boolean;
  userId?: string;
  plan?: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
