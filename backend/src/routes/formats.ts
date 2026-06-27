import { Router } from 'express';
import multer from 'multer';
import { importFormat, downloadTemplate, getFormats } from '../controllers/formatController';
import { verifyToken, isSuperAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Descargar plantilla
router.get('/template', verifyToken, isSuperAdmin, downloadTemplate);

// Obtener formatos existentes
router.get('/', verifyToken, isSuperAdmin, getFormats);

// Subir nuevo formato (se reemplaza)
router.post('/import', verifyToken, isSuperAdmin, upload.single('file'), importFormat);

export default router;
