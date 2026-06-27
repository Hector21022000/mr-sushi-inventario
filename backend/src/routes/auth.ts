import { Router } from 'express';
import { register, login, getUsers, updateUser, deleteUser } from '../controllers/authController';
import { verifyToken, isAdminOrSuperAdmin, isSuperAdmin } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas (Requieren autenticación y permisos)
router.get('/users', verifyToken, isAdminOrSuperAdmin, getUsers);
router.put('/users/:id', verifyToken, isAdminOrSuperAdmin, updateUser);
router.delete('/users/:id', verifyToken, isSuperAdmin, deleteUser);

export default router;
