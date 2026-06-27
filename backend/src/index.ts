/**
 * Qué hace el archivo: Punto de entrada del servidor backend de Express. Inicializa la base de datos y expone los servicios en el puerto 3001.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';
import { initDb } from './db/database';

// Cargar configuración local de dotenv (de la carpeta actual y de la raíz del monorepo si existe)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir la API
app.use('/api', apiRoutes);

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Servir archivos estáticos del frontend compilado en producción
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Cualquier otra ruta que no coincida redirige al index.html de React (soportar enrutamiento cliente)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Inicializar BD y arrancar servidor
async function startServer() {
  try {
    await initDb();
    
    // Programar el cierre automático diario a las 00:00
    scheduleMidnightAutoClose();

    app.listen(PORT, () => {
      console.log(`[Server] Corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Función para programar el cierre de inventarios a medianoche
function scheduleMidnightAutoClose() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Siguiente día
    0, 0, 0, 0 // Exactamente a las 00:00:00
  );
  
  const msToMidnight = midnight.getTime() - now.getTime();
  console.log(`[AutoClose] Programado cierre automático diario en ${(msToMidnight / 1000 / 60 / 60).toFixed(2)} horas.`);
  
  setTimeout(async () => {
    try {
      const db = await initDb(); // Obtener BD iniciada
      const dbInstance = await require('./db/database').getDb();
      const result = await dbInstance.run(
        `UPDATE inventories_history 
         SET estado = 'Cerrado', updated_at = CURRENT_TIMESTAMP 
         WHERE estado = 'Abierto'`
      );
      console.log(`[AutoClose] Cierre automático de medianoche ejecutado. Afectados: ${result.changes || 0}`);
    } catch (err) {
      console.error('[AutoClose] Error en ejecución de medianoche:', err);
    }
    // Reprogramar para la siguiente medianoche
    scheduleMidnightAutoClose();
  }, msToMidnight);
}

startServer();
