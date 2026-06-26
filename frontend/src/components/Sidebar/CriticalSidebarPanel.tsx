/**
 * Qué hace el archivo: Componente de Panel Lateral de Compras Críticas. Lista los productos con stock <= 2 y permite copiar la lista de compras para WhatsApp.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, MessageSquare, AlertTriangle, X } from 'lucide-react';

interface CriticalSidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CriticalSidebarPanel: React.FC<CriticalSidebarPanelProps> = ({ isOpen, onClose }) => {
  const { criticalItems, responsable } = useInventory();
  const [copied, setCopied] = useState<boolean>(false);

  // Copiar lista de compras estructurada para WhatsApp
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
    message += `⚠️ *PRODUCTOS CRÍTICOS (Stock ≤ 2):*\n`;

    criticalItems.forEach((item) => {
      const categoryLabel = item.category.startsWith('cajas') ? 'Cajas' :
                            item.category === 'acevichado' ? 'Acevichados' :
                            item.category === 'salseros' ? 'Salseros' :
                            item.category === 'utensilios' ? 'Utensilios' : 'Gaseosas';
      
      message += `• *${item.name}* (${categoryLabel}) - Stock actual: *${item.total} ${item.measure}* | _${item.requerimiento || 'Comprar urgente'}_\n`;
    });

    message += `\n_Generado automáticamente por el Sistema Inteligente de Control de Inventario MR·SUSHI._`;

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Fondo semitransparente */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col justify-between border-l border-gray-100"
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-600 text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-lg">Productos por Comprar</h3>
              <p className="text-xs text-red-100">Actualización en tiempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 bg-red-700/50 hover:bg-red-700/80 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Contenido (Lista de productos) */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {criticalItems.length > 0 ? (
            <>
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Hay <strong>{criticalItems.length}</strong> producto(s) en estado crítico de stock y necesitan reposición urgente.
                </span>
              </div>

              <div className="space-y-2">
                {criticalItems.map((item) => {
                  const categoryName = item.category === 'cajas_1' ? 'Cajas T1' :
                                       item.category === 'cajas_2' ? 'Cajas T2' :
                                       item.category === 'acevichado' ? 'Acevichados' :
                                       item.category === 'salseros' ? 'Salseros' :
                                       item.category === 'utensilios' ? 'Utensilios' : 'Gaseosas';

                  return (
                    <motion.div
                      layoutId={`critical-${item.id}`}
                      key={item.id}
                      className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {categoryName}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-xs font-medium text-[#E30613]">{item.requerimiento}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-red-100 text-red-700 font-extrabold px-2.5 py-1 rounded-xl text-sm border border-red-200">
                          {item.total} {item.measure}
                        </span>
                        <p className="text-[9px] text-gray-400 mt-1 font-semibold">Stock Actual</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">¡Inventario completo!</h4>
              <p className="text-xs text-gray-500 mt-1">
                No hay productos en estado crítico (Stock ≤ 2). Buen trabajo manteniendo el stock.
              </p>
            </div>
          )}
        </div>

        {/* Footer (Acción de compartir) */}
        {criticalItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/70 space-y-2">
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Copiar lista para WhatsApp
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center font-medium">
              Copia la lista con formato profesional listo para pegar en chats.
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
};
