import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-mr-sushi-2026';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    area: string | null;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Un token es requerido para autenticación' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  return next();
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Se requieren permisos de Superadministrador' });
  }
  return next();
};

export const isAdminOrSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Se requieren permisos de Administrador' });
  }
  return next();
};
