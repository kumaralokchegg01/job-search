import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Ensure env is loaded
if (!process.env.JWT_SECRET) {
  dotenv.config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_9f3a2b4c';

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
  userRole?: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId || decoded.sub).select('email roles tier');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.roles?.[0] || 'user';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    next();
  };
}

export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userRole || !['admin'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
