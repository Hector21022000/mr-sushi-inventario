/**
 * Qué hace el archivo: Define los endpoints de la API REST que conectan el frontend con los controladores.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Router } from 'express';
import { getInventory, updateInventoryItem } from '../controllers/inventoryController';
import { getHistory, clearHistory } from '../controllers/historyController';
import { saveReport } from '../controllers/reportController';

const router = Router();

// Rutas de Inventario
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateInventoryItem);

// Rutas de Historial
router.get('/history', getHistory);
router.delete('/history', clearHistory);

// Rutas de Reportes
router.post('/save-report', saveReport);

export default router;
