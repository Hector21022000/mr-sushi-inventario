import { getDb } from './db/database';

async function main() {
  const db = await getDb();
  console.log('Borrando inventarios de hoy (2026-06-27) para recrear con la nueva logica...');
  const res = await db.run("DELETE FROM inventories_history WHERE fecha = '2026-06-27'");
  console.log(`Eliminados: ${res.changes || 0} registros de hoy.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error al borrar inventarios:', err);
  process.exit(1);
});
