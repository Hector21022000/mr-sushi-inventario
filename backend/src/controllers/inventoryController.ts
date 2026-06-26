/**
 * Qué hace el archivo: Controlador de inventario. Gestiona la obtención, cálculo reactivo y actualización de ítems del inventario, registrando cambios en el historial.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Request, Response } from 'express';
import { getDb, calculateRequerimiento } from '../db/database';

export const getInventory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const items = await db.all('SELECT * FROM inventory ORDER BY category ASC, id ASC');
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    cajas_desarmadas,
    cajas_armadas,
    s_inicial,
    ingreso,
    consumido,
    merma,
    s_final,
    produccion,
    comentarios,
    responsable = 'Sistema'
  } = req.body;

  try {
    const db = await getDb();

    // Obtener el item actual antes del cambio
    const currentItem = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    if (!currentItem) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Mapear nuevos valores combinando cuerpo de petición con valores anteriores (o usar 0 si no se envían)
    const category = currentItem.category;
    const name = currentItem.name;

    const val = (newVal: any, oldVal: any) => (newVal !== undefined ? parseFloat(newVal) : oldVal);

    // Valores actualizados
    let next_cajas_desarmadas = val(cajas_desarmadas, currentItem.cajas_desarmadas);
    let next_cajas_armadas = val(cajas_armadas, currentItem.cajas_armadas);
    let next_s_inicial = val(s_inicial, currentItem.s_inicial);
    let next_ingreso = val(ingreso, currentItem.ingreso);
    let next_consumido = val(consumido, currentItem.consumido);
    let next_merma = val(merma, currentItem.merma);
    let next_s_final = val(s_final, currentItem.s_final);
    let next_produccion = val(produccion, currentItem.produccion);
    let next_comentarios = comentarios !== undefined ? comentarios : currentItem.comentarios;

    // Fórmulas de cálculo según la sección
    let total = 0;
    let cierre_turno = 0;
    let restante = 0;

    if (category === 'cajas_1' || category === 'cajas_2') {
      total = next_cajas_desarmadas + next_cajas_armadas;
      cierre_turno = total - next_consumido - next_merma;
    } else if (category === 'acevichado') {
      total = next_s_inicial + next_ingreso;
      restante = total - next_produccion;
    } else if (category === 'salseros') {
      total = next_s_inicial + next_ingreso;
      next_s_final = total - next_consumido;
    } else if (category === 'utensilios' || category === 'gaseosas') {
      total = next_s_inicial + next_ingreso;
      // s_final es entrada de usuario directa en estas dos categorías
    }

    // Calcular requerimiento
    const requerimiento = calculateRequerimiento(category, name, total, next_s_final, restante);

    // Actualizar base de datos
    await db.run(
      `UPDATE inventory
       SET cajas_desarmadas = ?, cajas_armadas = ?, s_inicial = ?, ingreso = ?,
           total = ?, consumido = ?, cierre_turno = ?, merma = ?, s_final = ?,
           restante = ?, produccion = ?, requerimiento = ?, comentarios = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        next_cajas_desarmadas,
        next_cajas_armadas,
        next_s_inicial,
        next_ingreso,
        total,
        next_consumido,
        cierre_turno,
        next_merma,
        next_s_final,
        restante,
        next_produccion,
        requerimiento,
        next_comentarios,
        id
      ]
    );

    // Detectar qué campos cambiaron y registrarlos en el historial
    const fieldsToTrack = [
      { field: 'cajas_desarmadas', label: 'Cajas Desarmadas' },
      { field: 'cajas_armadas', label: 'Cajas Armadas' },
      { field: 's_inicial', label: 'Stock Inicial' },
      { field: 'ingreso', label: 'Ingreso' },
      { field: 'consumido', label: 'Consumido' },
      { field: 'merma', label: 'Merma' },
      { field: 's_final', label: 'Stock Final' },
      { field: 'produccion', label: 'Producción' },
      { field: 'comentarios', label: 'Comentarios' }
    ];

    for (const item of fieldsToTrack) {
      let oldValStr = String(currentItem[item.field] ?? '');
      let newValStr = '';

      if (item.field === 'cajas_desarmadas') newValStr = String(next_cajas_desarmadas);
      else if (item.field === 'cajas_armadas') newValStr = String(next_cajas_armadas);
      else if (item.field === 's_inicial') newValStr = String(next_s_inicial);
      else if (item.field === 'ingreso') newValStr = String(next_ingreso);
      else if (item.field === 'consumido') newValStr = String(next_consumido);
      else if (item.field === 'merma') newValStr = String(next_merma);
      else if (item.field === 's_final') newValStr = String(next_s_final);
      else if (item.field === 'produccion') newValStr = String(next_produccion);
      else if (item.field === 'comentarios') newValStr = String(next_comentarios);

      if (oldValStr !== newValStr) {
        // Ignorar si ambos representan 0 (evitar falsos logs al inicializar vacíos)
        if ((oldValStr === '0' || oldValStr === '') && (newValStr === '0' || newValStr === '')) {
          continue;
        }

        await db.run(
          `INSERT INTO history (product_id, product_name, field_changed, value_old, value_new, responsable)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, name, item.label, oldValStr || '0', newValStr || '0', responsable]
        );
      }
    }

    // Retornar el ítem actualizado
    const updatedItem = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    res.json(updatedItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
