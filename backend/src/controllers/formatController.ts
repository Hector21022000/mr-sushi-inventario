import { Request, Response } from 'express';
import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';
import * as xlsx from 'xlsx';

export const importFormat = async (req: AuthRequest, res: Response) => {
  try {
    const area = req.body.area;
    if (!area) {
      return res.status(400).json({ error: 'El área es requerida' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo Excel' });
    }

    // Leer el archivo Excel en memoria
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir hoja a JSON. Asumimos la primera fila como cabecera
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío' });
    }

    const db = await getDb();

    // 1. Soft delete de los formatos anteriores de esta área
    await db.run('UPDATE inventory SET is_active = 0 WHERE area = ?', [area]);

    // 2. Insertar los nuevos productos del formato
    let insertedCount = 0;
    for (const row of rows) {
      // Intentar extraer datos perdonando mayúsculas/minúsculas
      const category = row['Categoría'] || row['Categoria'] || row['category'] || row['CATEGORY'] || 'General';
      const name = row['Producto'] || row['Nombre'] || row['name'] || row['NAME'];
      const measure = row['Medida'] || row['Unidad'] || row['measure'] || row['MEASURE'] || 'UND';

      if (!name) continue; // Ignorar filas sin nombre de producto

      // Insertamos el nuevo ítem, empezando todos sus stocks en 0
      await db.run(
        `INSERT INTO inventory (category, name, measure, area, is_active) 
         VALUES (?, ?, ?, ?, 1)`,
        [String(category).trim().toLowerCase(), String(name).trim(), String(measure).trim().toUpperCase(), area]
      );
      insertedCount++;
    }

    // Registrar en auditoría
    await logAudit(req, 'IMPORT_EXCEL_FORMAT', { area, insertedCount, filename: req.file?.originalname });

    res.json({ message: 'Formato importado exitosamente', newProductsCount: insertedCount });
  } catch (error: any) {
    console.error('Error importando formato:', error);
    res.status(500).json({ error: 'Error al procesar el archivo Excel. Verifique que el formato sea correcto.' });
  }
};

export const downloadTemplate = (req: Request, res: Response) => {
  // Crear un libro y hoja vacíos
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { Categoría: 'EjemploCat', Producto: 'Mi Producto', Medida: 'UND' },
    { Categoría: 'Salsas', Producto: 'Salsa Soya', Medida: 'LT' },
    { Categoría: 'Insumos', Producto: 'Arroz', Medida: 'KG' }
  ]);
  
  xlsx.utils.book_append_sheet(wb, ws, 'Formato');
  
  // Generar buffer
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla_formato.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const getFormats = async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    // Obtener los productos agrupados por area
    const areas = await db.all('SELECT DISTINCT area FROM inventory WHERE is_active = 1');
    const responseData = await Promise.all(areas.map(async (row: any) => {
      const area = row.area;
      const count = await db.get('SELECT COUNT(*) as c FROM inventory WHERE is_active = 1 AND area = ?', [area]);
      return {
        area,
        activeProducts: count.c,
      };
    }));
    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener los formatos' });
  }
};
