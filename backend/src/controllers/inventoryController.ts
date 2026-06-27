/**
 * Qué hace el archivo: Controlador de inventario. Gestiona la obtención, cálculo reactivo y actualización de ítems del inventario, registrando cambios en el historial.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { Request, Response } from 'express';
import { getDb, calculateRequerimiento } from '../db/database';
import crypto from 'crypto';

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
    responsable = 'Sistema',
    activeInventoryUuid,
    turno = ''
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
          `INSERT INTO history (product_id, product_name, field_changed, value_old, value_new, responsable, turno)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, name, item.label, oldValStr || '0', newValStr || '0', responsable, turno]
        );
      }
    }

    // Si hay un inventario histórico activo asociado, sincronizar el JSON del producto de inmediato
    if (activeInventoryUuid) {
      const activeInv = await db.get('SELECT productos FROM inventories_history WHERE uuid = ?', [activeInventoryUuid]);
      if (activeInv) {
        try {
          const products = JSON.parse(activeInv.productos);
          const idx = products.findIndex((p: any) => p.name === name && p.category === category);
          if (idx !== -1) {
            products[idx] = {
              ...products[idx],
              cajas_desarmadas: next_cajas_desarmadas,
              cajas_armadas: next_cajas_armadas,
              s_inicial: next_s_inicial,
              ingreso: next_ingreso,
              total,
              consumido: next_consumido,
              cierre_turno,
              merma: next_merma,
              s_final: next_s_final,
              restante,
              produccion: next_produccion,
              requerimiento,
              comentarios: next_comentarios,
              updated_at: new Date().toISOString()
            };

            await db.run(
              'UPDATE inventories_history SET productos = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ?',
              [JSON.stringify(products), activeInventoryUuid]
            );
          }
        } catch (e) {
          console.error('Error sincronizando item modificado en JSON de snapshot:', e);
        }
      }
    }

    // Retornar el ítem actualizado
    const updatedItem = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    res.json(updatedItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- NUEVOS CONTROLADORES DE HISTORIAL Y SESIONES ---

export const saveSession = async (req: Request, res: Response) => {
  const { encargado, turno } = req.body;
  if (!encargado || !turno) {
    return res.status(400).json({ error: 'Encargado y turno son requeridos' });
  }
  try {
    const db = await getDb();
    await db.run(
      'INSERT INTO user_sessions (encargado, turno) VALUES (?, ?)',
      [encargado, turno]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getActiveInventory = async (req: Request, res: Response) => {
  const encargado = req.query.encargado as string;
  const turno = req.query.turno as string;

  if (!encargado || !turno) {
    return res.status(400).json({ error: 'Encargado y turno son requeridos' });
  }

  try {
    const db = await getDb();
    // Obtener la fecha local YYYY-MM-DD
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const hoy = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

    const ahora = new Date();
    const horaStr = ahora.toTimeString().split(' ')[0];

    // 1. Buscar inventario abierto para hoy (independientemente del turno/encargado)
    let active = await db.get(
      `SELECT * FROM inventories_history 
       WHERE fecha = ? AND estado = 'Abierto'`,
      [hoy]
    );

    if (active) {
      let respObj: Record<string, any> = {};
      try {
        respObj = active.responsables ? JSON.parse(active.responsables) : {};
      } catch (e) {
        respObj = {};
      }

      // Registrar la sesión del encargado y turno actual
      respObj[turno] = { encargado, ingreso: horaStr };

      await db.run(
        'UPDATE inventories_history SET responsables = ? WHERE uuid = ?',
        [JSON.stringify(respObj), active.uuid]
      );

      active.productos = JSON.parse(active.productos);
      active.responsables = respObj;
      return res.json(active);
    }

    // 2. Si no hay inventario abierto hoy, verificar si ya se CERRÓ el del día de hoy
    const closedToday = await db.get(
      `SELECT * FROM inventories_history 
       WHERE fecha = ? AND estado = 'Cerrado'`,
      [hoy]
    );

    if (closedToday) {
      closedToday.productos = JSON.parse(closedToday.productos);
      try {
        closedToday.responsables = closedToday.responsables ? JSON.parse(closedToday.responsables) : {};
      } catch (e) {
        closedToday.responsables = {};
      }
      return res.json(closedToday);
    }

    // 3. Crear el nuevo inventario para hoy (primer inicio de sesión del día)
    const baseItems = await db.all('SELECT * FROM inventory ORDER BY category ASC, id ASC');

    // Buscar el último inventario cerrado en general para heredar stocks
    const lastClosed = await db.get(
      `SELECT productos FROM inventories_history 
       WHERE estado = 'Cerrado' 
       ORDER BY fecha DESC, hora DESC LIMIT 1`
    );

    let stockHeredado: Record<string, number> = {};
    if (lastClosed) {
      try {
        const lastProducts = JSON.parse(lastClosed.productos);
        lastProducts.forEach((p: any) => {
          if (p.category === 'cajas_1' || p.category === 'cajas_2') {
            stockHeredado[p.name] = p.cierre_turno || 0;
          } else if (p.category === 'acevichado') {
            stockHeredado[p.name] = p.restante || 0;
          } else {
            stockHeredado[p.name] = p.s_final || 0;
          }
        });
      } catch (e) {
        console.error('Error parseando productos de inventario cerrado anterior:', e);
      }
    }

    // Mapear items base
    const newProducts = baseItems.map((item: any) => {
      const stockAnterior = stockHeredado[item.name] || 0;
      
      const p = {
        ...item,
        cajas_desarmadas: item.category.startsWith('cajas') ? stockAnterior : 0,
        cajas_armadas: 0,
        s_inicial: !item.category.startsWith('cajas') ? stockAnterior : 0,
        ingreso: 0,
        total: stockAnterior,
        consumido: 0,
        cierre_turno: item.category.startsWith('cajas') ? stockAnterior : 0,
        merma: 0,
        s_final: !item.category.startsWith('cajas') ? stockAnterior : 0,
        restante: item.category === 'acevichado' ? stockAnterior : 0,
        produccion: 0,
        comentarios: ''
      };

      p.requerimiento = calculateRequerimiento(p.category, p.name, p.total, p.s_final, p.restante);
      return p;
    });

    const newUuid = crypto.randomUUID();
    const respObj: Record<string, any> = {};
    respObj[turno] = { encargado, ingreso: horaStr };

    await db.run(
      `INSERT INTO inventories_history (uuid, fecha, hora, encargado, turno, productos, responsables, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Abierto')`,
      [newUuid, hoy, horaStr, encargado, turno, JSON.stringify(newProducts), JSON.stringify(respObj)]
    );

    const created = {
      uuid: newUuid,
      fecha: hoy,
      hora: horaStr,
      encargado,
      turno,
      productos: newProducts,
      responsables: respObj,
      observaciones: '',
      estado: 'Abierto'
    };

    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateActiveInventory = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { productos, observaciones, estado } = req.body;

  if (!productos) {
    return res.status(400).json({ error: 'La lista de productos es requerida' });
  }

  try {
    const db = await getDb();
    const current = await db.get('SELECT * FROM inventories_history WHERE uuid = ?', [uuid]);
    
    if (!current) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }

    const nextEstado = estado || current.estado;
    const nextObservaciones = observaciones !== undefined ? observaciones : current.observaciones;

    await db.run(
      `UPDATE inventories_history 
       SET productos = ?, observaciones = ?, estado = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE uuid = ?`,
      [JSON.stringify(productos), nextObservaciones, nextEstado, uuid]
    );

    // Mantener la sincronización con la tabla clásica 'inventory'
    for (const p of productos) {
      await db.run(
        `UPDATE inventory 
         SET cajas_desarmadas = ?, cajas_armadas = ?, s_inicial = ?, ingreso = ?,
             total = ?, consumido = ?, cierre_turno = ?, merma = ?, s_final = ?,
             restante = ?, produccion = ?, requerimiento = ?, comentarios = ?, updated_at = CURRENT_TIMESTAMP
         WHERE category = ? AND name = ?`,
        [
          p.cajas_desarmadas || 0,
          p.cajas_armadas || 0,
          p.s_inicial || 0,
          p.ingreso || 0,
          p.total || 0,
          p.consumido || 0,
          p.cierre_turno || 0,
          p.merma || 0,
          p.s_final || 0,
          p.restante || 0,
          p.produccion || 0,
          p.requerimiento || '',
          p.comentarios || '',
          p.category,
          p.name
        ]
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const closeActiveInventory = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  try {
    const db = await getDb();
    const current = await db.get('SELECT * FROM inventories_history WHERE uuid = ?', [uuid]);
    
    if (!current) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }

    await db.run(
      `UPDATE inventories_history SET estado = 'Cerrado', updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
      [uuid]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryHistory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const logs = await db.all(
      `SELECT id, uuid, fecha, hora, encargado, turno, observaciones, estado, created_at, updated_at 
       FROM inventories_history 
       ORDER BY fecha DESC, hora DESC, id DESC`
    );
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryHistoryDetail = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const db = await getDb();
    const log = await db.get('SELECT * FROM inventories_history WHERE uuid = ?', [uuid]);
    if (!log) {
      return res.status(404).json({ error: 'Detalle de inventario no encontrado' });
    }
    log.productos = JSON.parse(log.productos);
    try {
      log.responsables = log.responsables ? JSON.parse(log.responsables) : {};
    } catch (e) {
      log.responsables = {};
    }
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
