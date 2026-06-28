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
  reopenActiveInventory,
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
router.post('/inventory/active/:uuid/reopen', reopenActiveInventory);

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
    // Leer como array 2D
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    await db.run("UPDATE inventory SET is_active = 0 WHERE area = 'Armado'");

    let count = 0;
    let currentCategory = 'cajas_1'; // Por defecto empezamos aquí
    
    for (const row of rows) {
      if (!row || row.length === 0) continue;
      
      // Detectar cambios de sección
      const strRow = row.join(' ').toUpperCase();
      if (strRow.includes('CIERRE TOTAL 1ER TURNO')) { currentCategory = 'cajas_1'; continue; }
      if (strRow.includes('CIERRE TOTAL 2DO TURNO')) { currentCategory = 'cajas_2'; continue; }
      if (row[0] === 'PRODUCTOS ACEVICHADO') { currentCategory = ''; continue; } // Ignorar esta sección
      if (row[0] === 'SALSEROS') { currentCategory = 'salseros'; continue; }
      if (row[0] === 'UTENCILIOS DE ARMADO' || row[0] === 'UTENSILIOS DE ARMADO') { currentCategory = 'utensilios'; continue; }
      if (row[0] === 'GASEOSAS') { currentCategory = 'gaseosas'; continue; }

      // Ignorar cabeceras sueltas
      if (row[0] === 'PRODUCTO' || row[0] === 'RESPONSABLE : _______________________________') continue;

      // Si tiene nombre de producto y medida, lo insertamos
      const name = row[0];
      const measure = row[1];
      
      if (currentCategory && typeof name === 'string' && name.trim() !== '') {
        await db.run(
          `INSERT INTO inventory (category, name, measure, area, is_active) 
           VALUES (?, ?, ?, 'Armado', 1)
           ON CONFLICT(category, name, area) DO UPDATE SET is_active = 1, measure = excluded.measure`,
          [currentCategory, name.trim(), (measure ? String(measure).trim().toUpperCase() : 'UND')]
        );
        count++;
      }
    }

    res.send(`<h1>Exito!</h1><p>Se extrajeron ${count} productos leyendo los grupos visuales (Primer Turno, Segundo Turno, Acevichado, Salseros, Utensilios, Gaseosas).</p><p>Puedes regresar a la aplicación y recargar la página.</p>`);
  } catch (error: any) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

export default router;
