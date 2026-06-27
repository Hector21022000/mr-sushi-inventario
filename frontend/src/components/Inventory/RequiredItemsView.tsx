/**
 * Qué hace el archivo: Componente de Productos Requeridos (Lista de Compras). Muestra una tabla con los productos que necesitan reabastecimiento automático.
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import { ShoppingCart, MessageSquare, Check, AlertCircle } from 'lucide-react';

export const RequiredItemsView: React.FC = () => {
  const { criticalItems, responsable } = useInventory();
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = () => {
    if (criticalItems.length === 0) return;

    const dateStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `*🛒 REQUERIMIENTO DE COMPRAS - MR·SUSHI 🍣*\n`;
    message += `*Fecha/Hora:* ${dateStr}\n`;
    message += `*Responsable:* ${responsable}\n\n`;
    message += `⚠️ *PRODUCTOS REQUERIDOS (Cajas < 50 | Gaseosas ≤ 2):*\n`;

    criticalItems.forEach((item) => {
      const categoryLabel = item.category.startsWith('cajas') ? 'Cajas' : 'Gaseosas';
      message += `• *${item.name}* (${categoryLabel}) - Stock actual: *${item.total} ${item.measure}* | _${item.requerimiento || 'Comprar urgente'}_\n`;
    });

    message += `\n_Generado automáticamente por el Sistema Inteligente de Control de Inventario MR·SUSHI._`;

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-600 animate-bounce" />
            Lista de Requerimientos Automáticos
          </h4>
          <p className="text-xs text-gray-500">
            Productos que están por debajo de sus límites ideales (Cajas de empaque & Bebidas)
          </p>
        </div>

        {criticalItems.length > 0 && (
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-emerald-600/10 focus:outline-none"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                ¡Copiado!
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Copiar para WhatsApp
              </>
            )}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        {criticalItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Sección</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Producto</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Medida</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Stock Actual</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado / Requerimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {criticalItems.map((item) => {
                  const categoryName = item.category === 'cajas_1' ? 'Cajas 1er Turno' :
                                       item.category === 'cajas_2' ? 'Cajas 2do Turno' : 'Gaseosas';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-4 text-sm font-semibold text-gray-500">{categoryName}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{item.name}</td>
                      <td className="p-4 text-xs font-medium text-gray-400">{item.measure}</td>
                      <td className="p-4 text-center">
                        <span className="bg-red-50 text-red-700 border border-red-100 font-bold px-3 py-1 rounded-xl inline-block text-sm">
                          {item.total}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {item.requerimiento}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 bg-gray-50/30">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4 border border-emerald-100">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-900">¡Inventario completo y suficiente!</p>
            <p className="text-xs text-gray-500 mt-1">
              No hay requerimientos activos de cajas o bebidas en este momento.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
