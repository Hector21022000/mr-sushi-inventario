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

// Ruta temporal de prueba para limpiar el inventario de hoy
import { getDb } from '../db/database';
router.get('/test/clear-today', async (req, res) => {
  try {
    const db = await getDb();
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const hoy = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    const result = await db.run("DELETE FROM inventories_history WHERE fecha = ?", [hoy]);
    res.send(`<h1>Exito</h1><p>Se eliminaron los inventarios de hoy (${hoy}) de la base de datos de Neon. Registros borrados: ${result.changes || 0}.</p><p>Ya puedes recargar la aplicacion (frontend) para ver los cambios.</p>`);
  } catch (error: any) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

router.get('/test/seed-armado', async (req, res) => {
  try {
    const db = await getDb();
    const excelPath = path.resolve(process.cwd(), '../Execel/Plantilla_Control_Inventario.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return res.status(404).send(`<h1>Error</h1><p>No se encontró el archivo Excel en la ruta: ${excelPath}</p>`);
    }

    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    await db.run("UPDATE inventory SET is_active = 0 WHERE area = 'Armado'");

    let count = 0;
    for (const row of rows) {
      const category = row['Categoría'] || row['Categoria'] || row['category'] || 'General';
      const name = row['Producto'] || row['Nombre'] || row['name'];
      const measure = row['Medida'] || row['Unidad'] || 'UND';

      if (!name) continue;

      await db.run(
        `INSERT INTO inventory (category, name, measure, area, is_active) VALUES (?, ?, ?, 'Armado', 1)`,
        [String(category).trim().toLowerCase(), String(name).trim(), String(measure).trim().toUpperCase()]
      );
      count++;
    }

    res.send(`<h1>Exito!</h1><p>Se insertaron ${count} productos en el área Armado a partir de tu archivo Excel original.</p><p>Puedes regresar a la aplicación y recargar la página.</p>`);
  } catch (error: any) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

export default router;
