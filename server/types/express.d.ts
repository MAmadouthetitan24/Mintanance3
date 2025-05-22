import { AuthUser } from '../routes/scheduling';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
} 