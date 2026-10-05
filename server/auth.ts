import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'noteflow_super_secret_jwt_key_development_only';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    tokenVersion: number;
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: string; email: string; name: string; tokenVersion: number }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const cookieToken = (req as any).cookies?.token;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }

  try {
    const db = await getDb();
    const result = await db.query<{ id: string; email: string; name: string; token_version: number; avatar: string }>(
      'SELECT id, email, name, token_version, avatar FROM users WHERE id = $1',
      [payload.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    const dbUser = result.rows[0];
    if (payload.tokenVersion !== undefined && payload.tokenVersion < dbUser.token_version) {
      res.status(401).json({ error: 'Session invalidated. Please log in again.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      tokenVersion: dbUser.token_version,
    };
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}
