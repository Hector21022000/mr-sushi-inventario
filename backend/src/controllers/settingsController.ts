import { Request, Response } from 'express';
import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const settings = await db.all('SELECT setting_key, setting_value, description FROM system_settings');
    
    // Convert to object for easier consumption by frontend
    const settingsObj: Record<string, string> = {};
    settings.forEach((s: any) => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body; // e.g. { module_cocina_enabled: 'false' }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Formato inválido' });
    }

    const db = await getDb();
    const oldSettings = await db.all('SELECT setting_key, setting_value FROM system_settings');
    const oldSettingsObj: Record<string, string> = {};
    oldSettings.forEach((s: any) => oldSettingsObj[s.setting_key] = s.setting_value);

    for (const [key, value] of Object.entries(updates)) {
      await db.run(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    await logAudit(req, 'UPDATE_SYSTEM_SETTINGS', { updates, previous: oldSettingsObj });

    res.json({ message: 'Configuración actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error actualizando settings:', error);
    res.status(500).json({ error: 'Error al guardar configuraciones' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    // Obtener los últimos 100 registros
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
};
