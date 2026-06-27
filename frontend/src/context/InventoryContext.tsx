/**
 * Qué hace el archivo: Contexto de React para gestionar el estado del inventario, responsable del turno, historial de auditoría y sincronización con el servidor.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// URL base de la API del backend
const API_URL = '/api';

export interface InventoryItem {
  id: number;
  category: string;
  name: string;
  measure: string;
  cajas_desarmadas: number;
  cajas_armadas: number;
  s_inicial: number;
  ingreso: number;
  total: number;
  consumido: number;
  cierre_turno: number;
  merma: number;
  s_final: number;
  restante: number;
  produccion: number;
  requerimiento: string;
  comentarios: string;
  updated_at: string;
}

export interface HistoryLog {
  id: number;
  product_id: number;
  product_name: string;
  field_changed: string;
  value_old: string;
  value_new: string;
  responsable: string;
  created_at: string;
}

interface DashboardStats {
  totalProducts: number;
  suficiente: number;
  medio: number;
  bajo: number;
  critico: number;
  sinStock: number;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  history: HistoryLog[];
  responsable: string;
  turno: string;
  activeInventoryUuid: string | null;
  isClosedToday: boolean;
  responsables: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  stats: DashboardStats;
  criticalItems: InventoryItem[];
  setResponsable: (name: string) => void;
  setTurno: (turno: string) => void;
  loginUser: (encargado: string, turno: string) => Promise<void>;
  logoutUser: () => void;
  fetchData: () => Promise<void>;
  updateItem: (id: number, data: Partial<InventoryItem>) => Promise<void>;
  clearLogs: () => Promise<void>;
  saveActiveInventorySnapshot: () => Promise<void>;
  closeInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory debe ser utilizado dentro de un InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [responsable, setResponsableState] = useState<string>(() => {
    return localStorage.getItem('mr_sushi_responsable') || '';
  });
  const [turno, setTurnoState] = useState<string>(() => {
    return localStorage.getItem('mr_sushi_turno') || '';
  });
  const [activeInventoryUuid, setActiveInventoryUuid] = useState<string | null>(null);
  const [isClosedToday, setIsClosedToday] = useState<boolean>(false);
  const [responsables, setResponsables] = useState<Record<string, any> | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Guardar responsable en localStorage
  const setResponsable = (name: string) => {
    setResponsableState(name);
    localStorage.setItem('mr_sushi_responsable', name);
  };

  // Guardar turno en localStorage
  const setTurno = (t: string) => {
    setTurnoState(t);
    localStorage.setItem('mr_sushi_turno', t);
  };

  // Obtener datos base del servidor
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invRes, histRes] = await Promise.all([
        axios.get<InventoryItem[]>(`${API_URL}/inventory`),
        axios.get<HistoryLog[]>(`${API_URL}/history`)
      ]);

      setInventory(invRes.data);
      setHistory(histRes.data);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setError('No se pudo conectar con el servidor de inventario.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar sesión e iniciar inventario activo
  const loginUser = async (encargado: string, turnoSeleccionado: string) => {
    setLoading(true);
    setError(null);
    try {
      // Registrar sesión en el backend
      await axios.post(`${API_URL}/sessions`, { encargado, turno: turnoSeleccionado });
      
      // Actualizar localStorage y states
      setResponsableState(encargado);
      setTurnoState(turnoSeleccionado);
      localStorage.setItem('mr_sushi_responsable', encargado);
      localStorage.setItem('mr_sushi_turno', turnoSeleccionado);

      // Obtener o crear inventario activo para este turno/usuario
      const activeRes = await axios.get(`${API_URL}/inventory/active`, {
        params: { encargado, turno: turnoSeleccionado }
      });

      setActiveInventoryUuid(activeRes.data.uuid);
      setInventory(activeRes.data.productos);
      setIsClosedToday(activeRes.data.estado === 'Cerrado');
      setResponsables(activeRes.data.responsables || null);
      
      // Cargar historial
      const histRes = await axios.get<HistoryLog[]>(`${API_URL}/history`);
      setHistory(histRes.data);
    } catch (err: any) {
      console.error('Error logging in user:', err);
      setError('Error al iniciar la sesión del inventario. Intente nuevamente.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logoutUser = () => {
    setResponsableState('');
    setTurnoState('');
    setActiveInventoryUuid(null);
    setIsClosedToday(false);
    setResponsables(null);
    setInventory([]);
    localStorage.removeItem('mr_sushi_responsable');
    localStorage.removeItem('mr_sushi_turno');
  };

  // Guardar instantánea (Snapshot JSON) en segundo plano
  const saveActiveInventorySnapshot = async () => {
    if (!activeInventoryUuid || inventory.length === 0) return;
    try {
      await axios.put(`${API_URL}/inventory/active/${activeInventoryUuid}`, {
        productos: inventory,
        observaciones: ''
      });
      setHasChanges(false);
    } catch (err) {
      console.error('Error auto-saving inventory snapshot:', err);
    }
  };

  // Cerrar inventario definitivamente
  const closeInventory = async () => {
    if (!activeInventoryUuid) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/inventory/active/${activeInventoryUuid}/close`);
      logoutUser();
    } catch (err) {
      console.error('Error closing active inventory:', err);
      setError('Error al cerrar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un ítem de inventario en tiempo real
  const updateItem = async (id: number, data: Partial<InventoryItem>) => {
    if (isClosedToday) return;
    try {
      // Optimistic update local para rapidez de UI
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const merged = { ...item, ...data };
            let total = merged.total;
            let cierre_turno = merged.cierre_turno;
            let restante = merged.restante;
            let s_final = merged.s_final;

            if (merged.category === 'cajas_1' || merged.category === 'cajas_2') {
              total = Number(merged.cajas_desarmadas || 0) + Number(merged.cajas_armadas || 0);
              cierre_turno = total - Number(merged.consumido || 0) - Number(merged.merma || 0);
            } else if (merged.category === 'acevichado') {
              total = Number(merged.s_inicial || 0) + Number(merged.ingreso || 0);
              restante = total - Number(merged.produccion || 0);
            } else if (merged.category === 'salseros') {
              total = Number(merged.s_inicial || 0) + Number(merged.ingreso || 0);
              s_final = total - Number(merged.consumido || 0);
            } else {
              total = Number(merged.s_inicial || 0) + Number(merged.ingreso || 0);
            }

            let req = '';
            const ref = total;

            if (merged.category === 'cajas_1' || merged.category === 'cajas_2') {
              req = ref >= 50 ? 'No requiere cajas' : ref > 0 ? 'Se requiere cajas para un stock adecuado' : 'URGENTE. Sin cajas. Comprar inmediatamente.';
            } else if (merged.category === 'gaseosas') {
              if (ref <= 2) {
                const ln = merged.name.toLowerCase();
                req = ln.includes('coca') ? 'Comprar Coca Cola' :
                      ln.includes('inka') ? 'Comprar Inca Kola' :
                      ln.includes('sprite') ? 'Comprar Sprite' :
                      ln.includes('fanta') ? 'Comprar Fanta' : `Comprar ${merged.name}`;
              } else {
                req = '';
              }
            } else {
              req = '';
            }

            return { ...merged, total, cierre_turno, restante, s_final, requerimiento: req };
          }
          return item;
        })
      );
      setHasChanges(true);

      // Petición al backend con autoguardado en tiempo real en la base de datos
      const res = await axios.put<InventoryItem>(`${API_URL}/inventory/${id}`, {
        ...data,
        responsable,
        activeInventoryUuid,
        turno
      });

      // Reemplazar con los datos calculados exactamente por el servidor
      setInventory((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      setHasChanges(true);

      // Refrescar el historial de auditoría
      const histRes = await axios.get<HistoryLog[]>(`${API_URL}/history`);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Error updating inventory item:', err);
      setError('Error al guardar los cambios en el servidor.');
    }
  };

  // Limpiar historial
  const clearLogs = async () => {
    try {
      await axios.delete(`${API_URL}/history`);
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history logs:', err);
      setError('Error al limpiar el historial.');
    }
  };

  // Cargar datos en el montaje
  useEffect(() => {
    const savedResponsable = localStorage.getItem('mr_sushi_responsable');
    const savedTurno = localStorage.getItem('mr_sushi_turno');
    
    if (savedResponsable && savedTurno) {
      loginUser(savedResponsable, savedTurno).catch(() => {
        fetchData();
      });
    } else {
      fetchData();
    }
  }, []);

  // Autoguardado periódico en segundo plano
  useEffect(() => {
    if (!activeInventoryUuid || !hasChanges) return;

    const interval = setInterval(() => {
      saveActiveInventorySnapshot();
    }, 15000); // Guardado automático cada 15 segundos

    return () => clearInterval(interval);
  }, [activeInventoryUuid, hasChanges, inventory]);

  // Guardado de emergencia al cerrar la aplicación (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeInventoryUuid && hasChanges && inventory.length > 0) {
        const payload = JSON.stringify({ productos: inventory, observaciones: '' });
        fetch(`${API_URL}/inventory/active/${activeInventoryUuid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeInventoryUuid, hasChanges, inventory]);

  // Chequeo de medianoche en el frontend (forzar cierre)
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('[AutoClose] Es medianoche en el cliente, forzando cierre diario...');
        closeInventory();
      }
    };

    const interval = setInterval(checkMidnight, 60000); // Comprobar cada minuto
    return () => clearInterval(interval);
  }, [activeInventoryUuid]);

  // Calcular estadísticas dinámicas para el dashboard
  const stats: DashboardStats = React.useMemo(() => {
    let suficiente = 0;
    let medio = 0;
    let bajo = 0;
    let critico = 0;
    let sinStock = 0;

    inventory.forEach((item) => {
      if (item.category === 'salseros' || item.category === 'acevichado') {
        return;
      }

      const totalVal = item.total;
      const isCaja = item.category.startsWith('cajas');
      
      if (isCaja) {
        if (totalVal >= 50) suficiente++;
        else if (totalVal >= 30) medio++;
        else if (totalVal >= 15) bajo++;
        else if (totalVal > 0) critico++;
        else sinStock++;
      } else {
        if (totalVal >= 10) suficiente++;
        else if (totalVal >= 5) medio++;
        else if (totalVal >= 3) bajo++;
        else if (totalVal > 0) critico++;
        else sinStock++;
      }
    });

    return {
      totalProducts: inventory.length,
      suficiente,
      medio,
      bajo,
      critico,
      sinStock
    };
  }, [inventory]);

  // Lista en tiempo real de productos requeridos
  const criticalItems = React.useMemo(() => {
    return inventory.filter((item) => {
      if (item.category === 'cajas_1' || item.category === 'cajas_2') {
        return item.total < 50;
      }
      if (item.category === 'gaseosas') {
        return item.total <= 2;
      }
      return false;
    });
  }, [inventory]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        history,
        responsable,
        turno,
        activeInventoryUuid,
        isClosedToday,
        responsables,
        loading,
        error,
        stats,
        criticalItems,
        setResponsable,
        setTurno,
        loginUser,
        logoutUser,
        fetchData,
        updateItem,
        clearLogs,
        saveActiveInventorySnapshot,
        closeInventory
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
