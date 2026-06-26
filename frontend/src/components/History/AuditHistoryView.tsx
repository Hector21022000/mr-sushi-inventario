/**
 * Qué hace el archivo: Componente de Historial de Auditoría. Permite visualizar, filtrar y limpiar los registros de cambios realizados en el inventario.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import { History, Search, Trash2, Calendar, User } from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
  const { history, clearLogs, loading } = useInventory();
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Formatear fecha legible
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Filtrar logs
  const filteredLogs = history.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      log.product_name.toLowerCase().includes(search) ||
      log.responsable.toLowerCase().includes(search) ||
      log.field_changed.toLowerCase().includes(search)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6"
    >
      {/* Cabecera y controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-red-600" />
            Historial de Auditoría
          </h4>
          <p className="text-xs text-gray-500">Registro detallado de cambios realizados por el personal en el inventario</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por producto, responsable..."
              className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-9 pr-4 text-sm w-full md:w-64 focus:bg-white focus:border-red-500 focus:outline-none transition-all"
            />
          </div>

          {/* Botón Borrar Todo */}
          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('¿Está seguro de que desea borrar todo el historial de auditoría?')) {
                  clearLogs();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 bg-red-50/20 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar Historial
            </button>
          )}
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="overflow-hidden rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando logs...</div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase">Hora</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase">Producto</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase">Campo</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Valor Anterior</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Valor Nuevo</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">{formatTime(log.created_at)}</td>
                    <td className="p-3 text-sm font-semibold text-gray-900">{log.product_name}</td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        {log.field_changed}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500 text-right font-mono">{log.value_old}</td>
                    <td className="p-3 text-sm text-gray-900 text-right font-mono font-semibold">{log.value_new}</td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {log.responsable}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium">No se encontraron registros en el historial</p>
            <p className="text-xs text-gray-400 mt-1">
              Las modificaciones de inventario aparecerán registradas aquí automáticamente.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
