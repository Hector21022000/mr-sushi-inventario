/**
 * Qué hace el archivo: Inicializa y gestiona la base de datos híbrida (PostgreSQL en producción y SQLite en desarrollo local).
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import pg from 'pg';

const dbPath = path.resolve(__dirname, '../../database.sqlite');

// Interfaz unificada de base de datos para independizar el motor de persistencia
export interface AppDatabase {
  exec(sql: string): Promise<void>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
}

let pgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool {
  if (!pgPool) {
    let connectionString = process.env.DATABASE_URL;
    if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
      try {
        const urlObj = new URL(connectionString);
        if (urlObj.searchParams.has('sslmode')) {
          urlObj.searchParams.delete('sslmode');
        }
        connectionString = urlObj.toString();
      } catch (err) {
        console.error('Error parsing DATABASE_URL:', err);
      }
    }
    pgPool = new pg.Pool({
      connectionString,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pgPool;
}

// Función auxiliar para convertir placeholders de "?" (SQLite) a "$1, $2, ..." (Postgres)
function convertSql(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Implementación del Adaptador para PostgreSQL
class PostgresDatabase implements AppDatabase {
  private pool: pg.Pool;

  constructor() {
    this.pool = getPgPool();
  }

  async exec(sql: string): Promise<void> {
    // Adaptar tipos y sintaxis específicos de SQLite a PostgreSQL
    let pgSql = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
      .replace(/REAL/gi, 'DOUBLE PRECISION');
    
    await this.pool.query(pgSql);
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const pgSql = convertSql(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows[0] || null;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const pgSql = convertSql(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows;
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const pgSql = convertSql(sql);
    const result = await this.pool.query(pgSql, params);
    return {
      lastID: (result as any).oid || 0,
      changes: result.rowCount || 0
    };
  }
}

// Implementación del Adaptador para SQLite
class SqliteDatabase implements AppDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return this.db.get(sql, params);
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return this.db.all(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const result = await this.db.run(sql, params);
    return {
      lastID: result.lastID,
      changes: result.changes
    };
  }
}

// Fábrica dinámica de base de datos dependiente de variables de entorno
export async function getDb(): Promise<AppDatabase> {
  if (process.env.DATABASE_URL) {
    return new PostgresDatabase();
  } else {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    return new SqliteDatabase(db);
  }
}

export async function initDb() {
  const db = await getDb();

  // Crear tabla de inventario
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      measure TEXT NOT NULL,
      cajas_desarmadas REAL DEFAULT 0,
      cajas_armadas REAL DEFAULT 0,
      s_inicial REAL DEFAULT 0,
      ingreso REAL DEFAULT 0,
      total REAL DEFAULT 0,
      consumido REAL DEFAULT 0,
      cierre_turno REAL DEFAULT 0,
      merma REAL DEFAULT 0,
      s_final REAL DEFAULT 0,
      restante REAL DEFAULT 0,
      produccion REAL DEFAULT 0,
      requerimiento TEXT DEFAULT '',
      comentarios TEXT DEFAULT '',
      area TEXT DEFAULT 'Armado',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, name, area)
    )
  `);

  // Crear tabla de historial
  await db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      field_changed TEXT NOT NULL,
      value_old TEXT NOT NULL,
      value_new TEXT NOT NULL,
      responsable TEXT NOT NULL,
      turno TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de sesiones de usuario
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encargado TEXT NOT NULL,
      turno TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de historial de inventarios (snapshots)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventories_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      encargado TEXT NOT NULL,
      turno TEXT NOT NULL,
      productos TEXT NOT NULL,
      responsables TEXT DEFAULT '{}',
      observaciones TEXT DEFAULT '',
      estado TEXT DEFAULT 'Abierto',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Semillero inicial de productos (seeding)
  const initialProducts = [
    // CAJAS 1ER TURNO
    { category: 'cajas_1', name: 'Cajas x 1 Maki', measure: 'UND' },
    { category: 'cajas_1', name: 'Cajas x 2 Makis', measure: 'UND' },
    { category: 'cajas_1', name: 'Cajas x 3 Makis', measure: 'UND' },
    { category: 'cajas_1', name: 'Cajas x 5 Makis', measure: 'UND' },

    // CAJAS 2DO TURNO
    { category: 'cajas_2', name: 'Cajas x 1 Maki', measure: 'UND' },
    { category: 'cajas_2', name: 'Cajas x 2 Makis', measure: 'UND' },
    { category: 'cajas_2', name: 'Cajas x 3 Makis', measure: 'UND' },
    { category: 'cajas_2', name: 'Cajas x 5 Makis', measure: 'UND' },

    // PRODUCTOS ACEVICHADO
    { category: 'acevichado', name: 'AJO', measure: 'KG' },
    { category: 'acevichado', name: 'HONDASHI', measure: 'KG' },
    { category: 'acevichado', name: 'SHOYU', measure: 'LT' },
    { category: 'acevichado', name: 'SAL', measure: 'KG' },
    { category: 'acevichado', name: 'LIMON', measure: 'KG' },
    { category: 'acevichado', name: 'Cebolla', measure: 'KG' },

    // SALSEROS
    { category: 'salseros', name: 'SALSEROS', measure: 'UND' },

    // UTENSILIOS DE ARMADO
    { category: 'utensilios', name: 'PAPEL MANTECA', measure: 'UND' },
    { category: 'utensilios', name: 'CINTA ROJA N/E', measure: 'UND' },
    { category: 'utensilios', name: 'CONTOMETROS', measure: 'UND' },
    { category: 'utensilios', name: 'BOLSAS KRAFT #25', measure: 'UND' },
    { category: 'utensilios', name: 'BOLSAS KRAFT #5', measure: 'UND' },
    { category: 'utensilios', name: 'WARIBASHI', measure: 'UND' },
    { category: 'utensilios', name: 'CINTA DE EMBALAJE', measure: 'UND' },
    { category: 'utensilios', name: 'GRAPAS', measure: 'UND' },
    { category: 'utensilios', name: 'SERVILLETAS', measure: 'UND' },
    { category: 'utensilios', name: 'CUCHARAS PLASTICO', measure: 'UND' },
    { category: 'utensilios', name: 'TENEDORES PLASTICO', measure: 'UND' },

    // GASEOSAS
    { category: 'gaseosas', name: 'FANTA 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'SPRITE 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'COCA ORIGINAL 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'INKA ORIGINAL 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'COCA ZERO 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'INKA ZERO 300 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'FANTA 500 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'SPRITE 500 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'COCA ORIGINAL 500 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'INKA ORIGINAL 500 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'COCA ZERO 500 ML', measure: 'UND' },
    { category: 'gaseosas', name: 'INKA ZERO 500 ML', measure: 'UND' }
  ];

  const areas = ['Armado', 'Barra', 'Cocina'];
  for (const ar of areas) {
    for (const product of initialProducts) {
      const existing = await db.get(
        'SELECT id FROM inventory WHERE category = ? AND name = ? AND area = ?',
        [product.category, product.name, ar]
      );

      if (!existing) {
        // Calcular valores iniciales
        const total = 0;
        const calculatedReq = calculateRequerimiento(product.category, product.name, total, 0, 0);

        await db.run(
          `INSERT INTO inventory (category, name, measure, total, requerimiento, area) VALUES (?, ?, ?, ?, ?, ?)`,
          [product.category, product.name, product.measure, total, calculatedReq, ar]
        );
      }
    }
  }

  // Recalcular y actualizar requerimientos para todos los productos de acuerdo a las nuevas reglas
  const allItems = await db.all('SELECT * FROM inventory');
  for (const item of allItems) {
    const req = calculateRequerimiento(item.category, item.name, item.total, item.s_final, item.restante);
    await db.run('UPDATE inventory SET requerimiento = ? WHERE id = ?', [req, item.id]);
  }

  // Actualizar esquema de BD para bases de datos existentes de forma segura
  try {
    await db.exec(`ALTER TABLE history ADD COLUMN turno TEXT DEFAULT ''`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }
  
  try {
    await db.exec(`ALTER TABLE inventories_history ADD COLUMN responsables TEXT DEFAULT '{}'`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }

  try {
    await db.exec(`ALTER TABLE inventories_history ADD COLUMN area TEXT DEFAULT 'Armado'`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }

  try {
    await db.exec(`ALTER TABLE inventory ADD COLUMN area TEXT DEFAULT 'Armado'`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }

  // Migración para Neon (PostgreSQL): reemplazar la restricción UNIQUE anterior
  if (process.env.DATABASE_URL) {
    try {
      await db.exec(`ALTER TABLE inventory DROP CONSTRAINT inventory_category_name_key`);
    } catch (e) {
      // Ignorar si no existe
    }
    try {
      await db.exec(`ALTER TABLE inventory ADD CONSTRAINT inventory_category_name_area_key UNIQUE (category, name, area)`);
    } catch (e) {
      // Ignorar si ya existe
    }
  }

  try {
    await db.exec(`ALTER TABLE user_sessions ADD COLUMN area TEXT DEFAULT 'Armado'`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }

  try {
    await db.exec(`ALTER TABLE history ADD COLUMN area TEXT DEFAULT 'Armado'`);
  } catch (e) {
    // Falla silenciosamente si la columna ya existe
  }

  console.log('Database initialized, seeded, and requirements updated.');
}

// Función auxiliar para calcular requerimiento según la lógica del negocio
export function calculateRequerimiento(
  category: string,
  name: string,
  total: number,
  closingStock: number,
  restanteStock: number
): string {
  // Solo cajas y gaseosas calculan requerimiento
  if (category !== 'cajas_1' && category !== 'cajas_2' && category !== 'gaseosas') {
    return '';
  }

  const stockReference = category === 'cajas_1' || category === 'cajas_2' ? total : total;

  if (category === 'cajas_1' || category === 'cajas_2') {
    if (stockReference >= 50) {
      return 'No requiere cajas';
    } else if (stockReference > 0) {
      return 'Se requiere cajas para un stock adecuado';
    } else {
      return 'URGENTE. Sin cajas. Comprar inmediatamente.';
    }
  }

  if (category === 'gaseosas') {
    if (stockReference <= 2) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('coca')) return 'Comprar Coca Cola';
      if (lowerName.includes('inka')) return 'Comprar Inca Kola';
      if (lowerName.includes('sprite')) return 'Comprar Sprite';
      if (lowerName.includes('fanta')) return 'Comprar Fanta';
      return `Comprar ${name}`;
    }
    return '';
  }

  return '';
}
