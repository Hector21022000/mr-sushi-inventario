/**
 * Qué hace el archivo: Controlador de historial de auditoría. Obtiene los logs de cambios cronológicos.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Request, Response } from 'express';
import { getDb } from '../db/database';

export const getHistory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    // Obtener los logs ordenados por fecha descendiente (el más reciente primero)
    const logs = await db.all('SELECT * FROM history ORDER BY created_at DESC, id DESC LIMIT 500');
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM history');
    res.json({ message: 'Historial limpiado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
