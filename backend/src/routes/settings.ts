import { Router } from 'express';
import { getSettings, updateSettings, getAuditLogs } from '../controllers/settingsController';
import { verifyToken, isSuperAdmin } from '../middleware/auth';

const router = Router();

// Públicas (Cualquier usuario autenticado puede leer para armar su UI)
router.get('/', verifyToken, getSettings);

// Privadas (Solo el Superadmin puede guardar cambios de configuración)
router.put('/', verifyToken, isSuperAdmin, updateSettings);

// Historial de Auditoría
router.get('/audit', verifyToken, isSuperAdmin, getAuditLogs);

export default router;
