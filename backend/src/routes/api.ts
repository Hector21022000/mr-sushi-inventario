/**
 * Qué hace el archivo: Define los endpoints de la API REST que conectan el frontend con los controladores.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Router } from 'express';
import { 
  getInventory, 
  updateInventoryItem,
  saveSession,
  getActiveInventory,
  updateActiveInventory,
  closeActiveInventory,
  getInventoryHistory,
  getInventoryHistoryDetail
} from '../controllers/inventoryController';
import { getHistory, clearHistory } from '../controllers/historyController';
import { saveReport } from '../controllers/reportController';

const router = Router();

// Rutas de Inventario (Heredadas)
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateInventoryItem);

// Rutas de Sesión y Login
router.post('/sessions', saveSession);

// Rutas de Inventario Activo (Snapshots & Autoguardado)
router.get('/inventory/active', getActiveInventory);
router.put('/inventory/active/:uuid', updateActiveInventory);
router.post('/inventory/active/:uuid/close', closeActiveInventory);

// Rutas de Historial de Snapshots (Calendario)
router.get('/inventory/history', getInventoryHistory);
router.get('/inventory/history/:uuid', getInventoryHistoryDetail);

// Rutas de Historial (Auditoría)
router.get('/history', getHistory);
router.delete('/history', clearHistory);

// Rutas de Reportes
router.post('/save-report', saveReport);

export default router;
