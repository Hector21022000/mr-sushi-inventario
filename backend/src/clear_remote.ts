import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const hoyServidor = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

  console.log(`Conectado a Neon DB. Borrando cierres de la fecha: ${hoyServidor}...`);

  try {
    const result = await pool.query("DELETE FROM inventories_history WHERE fecha = $1 AND estado = 'Cerrado'", [hoyServidor]);
    console.log(`¡Éxito! Se reabrieron ${result.rowCount} inventarios del día de hoy.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
