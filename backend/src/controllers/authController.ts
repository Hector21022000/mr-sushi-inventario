import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-mr-sushi-2026';
const SUPERADMIN_CODE = '7573';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, username, password, specialCode } = req.body;
    
    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña son requeridos' });
    }

    const db = await getDb();
    
    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    let role = 'worker';
    let status = 'pending';

    if (specialCode === SUPERADMIN_CODE) {
      // Verificar si ya existe algún superadmin
      const hasSuperAdmin = await db.get('SELECT id FROM users WHERE role = ?', ['superadmin']);
      if (!hasSuperAdmin) {
        role = 'superadmin';
        status = 'active'; // Superadmin always active
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO users (full_name, username, password, status, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, username, hashedPassword, status, role]
    );

    res.status(201).json({ message: 'Usuario registrado con éxito', role, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.status !== 'active' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: user.status === 'pending' 
          ? 'Cuenta pendiente de asignación por el administrador' 
          : 'Cuenta deshabilitada o suspendida' 
      });
    }

    // Update last login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, area: user.area, turno: user.turno, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        area: user.area,
        turno: user.turno,
        status: user.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, full_name, username, status, role, area, turno, created_at, last_login FROM users');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, status, area, turno } = req.body;

    const db = await getDb();
    const targetUser = await db.get('SELECT role, status, area, turno FROM users WHERE id = ?', [id]);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Admins cannot modify Superadmins
    if (req.user?.role === 'admin' && targetUser.role === 'superadmin') {
      return res.status(403).json({ error: 'Acción no permitida contra un superadministrador' });
    }

    // Solo el Superadmin puede asignar rol de Admin o Superadmin
    if (req.user?.role !== 'superadmin' && (role === 'admin' || role === 'superadmin')) {
      return res.status(403).json({ error: 'Acción no permitida' });
    }

    await db.run(
      'UPDATE users SET role = ?, status = ?, area = ?, turno = ? WHERE id = ?',
      [
        role !== undefined ? role : targetUser.role,
        status !== undefined ? status : targetUser.status,
        area !== undefined ? area : targetUser.area,
        turno !== undefined ? turno : targetUser.turno,
        id
      ]
    );

    await logAudit(req, 'UPDATE_USER', {
      targetUserId: id,
      changes: {
        role: role !== undefined ? role : targetUser.role,
        status: status !== undefined ? status : targetUser.status,
        area: area !== undefined ? area : targetUser.area,
        turno: turno !== undefined ? turno : targetUser.turno,
      }
    });

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    const targetUser = await db.get('SELECT role FROM users WHERE id = ?', [id]);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo superadmin puede borrar, y no a sí mismo
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadministrador puede eliminar cuentas' });
    }

    if (parseInt(id) === req.user?.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    await logAudit(req, 'DELETE_USER', { targetUserId: id, deletedRole: targetUser.role });
    
    res.json({ message: 'Usuario eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
