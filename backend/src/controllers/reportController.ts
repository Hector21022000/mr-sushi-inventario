/**
 * Qué hace el archivo: Controlador del backend para guardar reportes (JPG, PNG, PDF, Excel) directamente en el disco del servidor para evitar bloqueos del navegador.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const saveReport = async (req: Request, res: Response) => {
  const { fileName, base64Data, format } = req.body;

  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (fileName o base64Data).' });
  }

  try {
    // Definir la ruta del directorio "Reportes" de forma relativa a la raíz del proyecto
    const reportDir = path.resolve(__dirname, '../../../Reportes');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Extraer la data base64 pura (remover prefijos data:image/... si existen)
    let cleanBase64 = base64Data;
    if (base64Data.includes(';base64,')) {
      cleanBase64 = base64Data.split(';base64,')[1];
    }

    // Convertir a buffer
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Ruta completa de destino del archivo
    const destPath = path.join(reportDir, fileName);
    
    // Escribir el archivo
    fs.writeFileSync(destPath, buffer);

    console.log(`[Reportes] Guardado local exitoso: ${destPath}`);

    res.json({
      success: true,
      message: 'Reporte guardado localmente con éxito.',
      filePath: destPath,
      fileName
    });
  } catch (error: any) {
    console.error('Error al guardar el reporte localmente:', error);
    res.status(500).json({ error: 'No se pudo guardar el reporte en el disco del servidor: ' + error.message });
  }
};
