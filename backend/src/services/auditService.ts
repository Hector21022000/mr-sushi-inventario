import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Registra una acción administrativa en la base de datos de auditoría.
 */
export const logAudit = async (
  req: AuthRequest,
  action: string,
  details: any
) => {
  try {
    const userId = req.user?.id || 0;
    const username = req.user?.username || 'sistema';
    // Obtener IP (considerando proxys como Render)
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

    const db = await getDb();
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, username, action, detailsString, ipAddress]
    );
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
    // No lanzamos el error para no romper el flujo principal si el log falla.
  }
};
