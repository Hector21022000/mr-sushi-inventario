import { getDb } from './db/database';

async function cleanGhostSessions() {
  try {
    const db = await getDb();
    const result = await db.run(`DELETE FROM inventories_history WHERE area IN ('Barra', 'Cocina')`);
    console.log('✅ Registros fantasma de Barra y Cocina eliminados correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar registros fantasma:', error);
    process.exit(1);
  }
}

cleanGhostSessions();
