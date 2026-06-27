/**
 * Qué hace el archivo: Componente de Tablas de Inventario Unificadas. Presenta todas las categorías en un solo apartado continuo con buscador general y botones de exportación al final.
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory, type InventoryItem } from '../../context/InventoryContext';
import { useSettings } from '../../context/SettingsContext';
import { ReportGenerator } from '../Reports/ReportGenerator';
import { motion } from 'framer-motion';
import { AlertCircle, FileSpreadsheet, Search, Check, RefreshCw, ChevronDown } from 'lucide-react';

// Determinar color de celda TOTAL basado en reglas por categoría (Cajas = 50, otros = 10)
const getTotalCellStyle = (total: number, category: string) => {
  const isCaja = category.startsWith('cajas');
  const suficiente = isCaja ? 50 : 10;
  const medio = isCaja ? 30 : 5;
  const bajo = isCaja ? 15 : 3;

  if (total >= suficiente) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-1 rounded-lg inline-block text-center min-w-[70px]';
  } else if (total >= medio) {
    return 'bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-2 py-1 rounded-lg inline-block text-center min-w-[70px]';
  } else if (total >= bajo) {
    return 'bg-orange-50 text-orange-700 border border-orange-100 font-semibold px-2 py-1 rounded-lg inline-block text-center min-w-[70px]';
  } else {
    return 'bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-1 rounded-lg inline-block text-center min-w-[70px] animate-pulse shadow-sm shadow-red-100';
  }
};

// Estilos de requerimiento (badges)
const getReqBadge = (req: string) => {
  if (!req) return <span className="text-gray-400 text-xs italic">-</span>;

  const lowerReq = req.toLowerCase();

  if (lowerReq.includes('urgente') || lowerReq.includes('crítico')) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        {req}
      </span>
    );
  }

  if (lowerReq.includes('comprar')) {
    return (
      <span className="inline-flex items-center bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold animate-pulse">
        {req}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
      {req}
    </span>
  );
};

// Componente Input numérico para edición reactiva
const InlineNumberInput: React.FC<{
  item: InventoryItem;
  field: keyof InventoryItem;
  placeholder?: string;
}> = ({ item, field, placeholder = '0' }) => {
  const { updateItem, isClosedToday } = useInventory();
  const [val, setVal] = useState<string>(String(item[field] ?? '0'));
  const [saved, setSaved] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isFocused && !showDropdown) {
      setVal(String(item[field] ?? '0'));
    }
  }, [item[field], isFocused, showDropdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    if (inputVal === '' || /^\d*\.?\d*$/.test(inputVal)) {
      setVal(inputVal);
    }
  };

  const handleBlur = () => {
    // Retrasar el cierre para dar tiempo a registrar clics en el dropdown
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
    }, 150);

    const parsed = val === '' ? 0 : parseFloat(val);
    if (parsed !== parseFloat(String(item[field] ?? '0'))) {
      updateItem(item.id, { [field]: parsed }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 800);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const selectNumber = (num: number) => {
    setVal(String(num));
    setShowDropdown(false);
    setIsFocused(false);
    if (num !== parseFloat(String(item[field] ?? '0'))) {
      updateItem(item.id, { [field]: num }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 800);
      });
    }
  };

  // Números sugeridos comunes para el inventario
  const numberOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="relative flex items-center justify-center">
      <div className={`relative flex items-center border rounded-lg transition-all w-20 md:w-24 ${
        isClosedToday
          ? 'bg-gray-100/80 border-gray-200 cursor-not-allowed'
          : 'bg-gray-50 border-gray-200 focus-within:bg-white focus-within:border-red-500'
      }`}>
        <input
          type="text"
          value={val === '0' && field !== 'comentarios' ? '' : val}
          onChange={handleChange}
          onFocus={() => {
            if (isClosedToday) return;
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isClosedToday}
          className={`w-full bg-transparent border-0 py-1 pl-2 pr-6 text-center text-sm font-medium text-gray-800 focus:outline-none focus:ring-0 ${
            isClosedToday ? 'cursor-not-allowed text-gray-400' : ''
          }`}
        />
        <button
          type="button"
          disabled={isClosedToday}
          onMouseDown={(e) => {
            if (isClosedToday) return;
            e.preventDefault(); // Previene blur del input
            setShowDropdown(!showDropdown);
          }}
          className={`absolute right-1 focus:outline-none ${
            isClosedToday ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 divide-y divide-gray-50 scrollbar-thin">
          {numberOptions.map((num) => (
            <button
              key={num}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Muy importante: evita blur del input al hacer click
                selectNumber(num);
              }}
              className="w-full text-center py-1 text-xs hover:bg-red-50 hover:text-red-600 transition-colors font-semibold text-gray-700 block"
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {saved && (
        <span className="absolute -right-4 text-emerald-500 animate-fade-out">
          <Check className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
};

// Componente Input texto para comentarios
const InlineTextInput: React.FC<{
  item: InventoryItem;
  field: keyof InventoryItem;
}> = ({ item, field }) => {
  const { updateItem, isClosedToday } = useInventory();
  const [val, setVal] = useState<string>(String(item[field] ?? ''));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isFocused) {
      setVal(String(item[field] ?? ''));
    }
  }, [item[field], isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    if (val !== String(item[field] ?? '')) {
      updateItem(item.id, { [field]: val });
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onFocus={() => {
        if (isClosedToday) return;
        setIsFocused(true);
      }}
      onBlur={handleBlur}
      disabled={isClosedToday}
      placeholder={isClosedToday ? "" : "Comentario..."}
      className={`w-full bg-transparent border-b border-transparent focus:outline-none py-0.5 px-1 text-sm text-gray-600 transition-colors ${
        isClosedToday
          ? 'cursor-not-allowed text-gray-400'
          : 'hover:border-gray-200 focus:border-red-500'
      }`}
    />
  );
};

export const InventoryTablesView: React.FC = () => {
  const { inventory, loading, fetchData } = useInventory();
  const { settings } = useSettings();

  const isCol = (key: string) => settings[key] !== 'false';

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrar items por categoría y búsqueda
  const getFilteredItems = (category: string) => {
    let items = inventory.filter(item => item.category === category);

    if (searchTerm.trim() !== '') {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return items;
  };

  // Extraer categorías únicas del inventario y crear secciones dinámicas
  const uniqueCategories = Array.from(new Set(inventory.map(item => item.category)));
  
  const sections = uniqueCategories.map(cat => {
    let type = 'default';
    const catLower = cat.toLowerCase();
    // Asignar el tipo de plantilla de columnas según la categoría
    if (catLower.includes('caja')) type = 'cajas';
    else if (catLower.includes('acevichado')) type = 'acevichado';
    else if (catLower.includes('salsero') || catLower.includes('contenedor')) type = 'salseros';
    
    return {
      id: cat,
      label: cat.toUpperCase(),
      type
    };
  });

  // Comprobar si al menos un producto coincide con la búsqueda
  const matchesCount = sections.reduce((acc, sec) => acc + getFilteredItems(sec.id).length, 0);

  return (
    <div className="space-y-8">
      {/* Caja de búsqueda y controles globales */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg">Inventario Completo</h3>
          <p className="text-xs text-gray-500">
            Vista unificada de todas las secciones del restaurante. Modifique cantidades e inputs directamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto..."
              className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-9 pr-4 text-sm w-full focus:bg-white focus:border-red-500 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={fetchData}
            title="Sincronizar datos"
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tablas Continuas */}
      {matchesCount > 0 ? (
        <div className="space-y-8">
          {sections.map((section) => {
            const items = getFilteredItems(section.id);
            if (items.length === 0) return null; // Ocultar sección si no coincide la búsqueda

            return (
              <motion.div
                layout
                key={section.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Cabecera de la categoría */}
                <div className="bg-red-600 px-6 py-3 flex items-center gap-2 text-white">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">{section.label}</span>
                </div>

                {/* Tabla de la categoría */}
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    {/* Encabezado dinámico según sección */}
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Producto</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Medida</th>
                        {section.type === 'cajas' ? (
                          <>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cajas Desarmadas</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cajas Armadas</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">TOTAL</th>
                            {isCol('col_consumido_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Consumido</th>}
                            {isCol('col_merma_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Merma</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cierre Turno</th>
                            {isCol('col_req_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Requerimiento</th>}
                            {isCol('col_comentarios_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Comentarios</th>}
                          </>
                        ) : section.type === 'acevichado' ? (
                          <>
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">S. Inicial</th>}
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ingreso</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">TOTAL</th>
                            {isCol('col_produccion_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Producción</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Restante</th>
                            {isCol('col_req_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Requerimiento</th>}
                          </>
                        ) : section.type === 'salseros' ? (
                          <>
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">S. Inicial</th>}
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ingreso</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">TOTAL</th>
                            {isCol('col_consumido_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Consumido</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">S. Final</th>
                            {isCol('col_req_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Requerimiento</th>}
                          </>
                        ) : (
                          <>
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">S. Inicial</th>}
                            {isCol('col_ingreso_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ingreso</th>}
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">TOTAL</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">S. Final</th>
                            {isCol('col_req_enabled') && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Requerimiento</th>}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="p-4 text-sm font-bold text-gray-900">{item.name}</td>
                          <td className="p-4 text-xs font-semibold text-gray-400">{item.measure}</td>
                          {section.type === 'cajas' ? (
                            <>
                              <td className="p-4"><InlineNumberInput item={item} field="cajas_desarmadas" /></td>
                              <td className="p-4"><InlineNumberInput item={item} field="cajas_armadas" /></td>
                              <td className="p-4 text-center">
                                <span className={getTotalCellStyle(item.total, item.category)}>{item.total}</span>
                              </td>
                              {isCol('col_consumido_enabled') && <td className="p-4"><InlineNumberInput item={item} field="consumido" /></td>}
                              {isCol('col_merma_enabled') && <td className="p-4"><InlineNumberInput item={item} field="merma" /></td>}
                              <td className="p-4 text-sm font-bold text-gray-900">{item.cierre_turno}</td>
                              {isCol('col_req_enabled') && <td className="p-4">{getReqBadge(item.requerimiento)}</td>}
                              {isCol('col_comentarios_enabled') && <td className="p-4 min-w-[150px]"><InlineTextInput item={item} field="comentarios" /></td>}
                            </>
                          ) : section.type === 'acevichado' ? (
                            <>
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="s_inicial" /></td>}
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="ingreso" /></td>}
                              <td className="p-4 text-center">
                                <span className={getTotalCellStyle(item.total, item.category)}>{item.total}</span>
                              </td>
                              {isCol('col_produccion_enabled') && <td className="p-4"><InlineNumberInput item={item} field="produccion" /></td>}
                              <td className="p-4 text-sm font-bold text-gray-900">{item.restante}</td>
                              {isCol('col_req_enabled') && <td className="p-4">{getReqBadge(item.requerimiento)}</td>}
                            </>
                          ) : section.type === 'salseros' ? (
                            <>
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="s_inicial" /></td>}
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="ingreso" /></td>}
                              <td className="p-4 text-center">
                                <span className={getTotalCellStyle(item.total, item.category)}>{item.total}</span>
                              </td>
                              {isCol('col_consumido_enabled') && <td className="p-4"><InlineNumberInput item={item} field="consumido" /></td>}
                              <td className="p-4 text-sm font-bold text-gray-900">{item.s_final}</td>
                              {isCol('col_req_enabled') && <td className="p-4">{getReqBadge(item.requerimiento)}</td>}
                            </>
                          ) : (
                            <>
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="s_inicial" /></td>}
                              {isCol('col_ingreso_enabled') && <td className="p-4"><InlineNumberInput item={item} field="ingreso" /></td>}
                              <td className="p-4 text-center">
                                <span className={getTotalCellStyle(item.total, item.category)}>{item.total}</span>
                              </td>
                              <td className="p-4"><InlineNumberInput item={item} field="s_final" /></td>
                              {isCol('col_req_enabled') && <td className="p-4">{getReqBadge(item.requerimiento)}</td>}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center text-gray-400 rounded-3xl border border-gray-100">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-900">No se encontraron productos</p>
          <p className="text-xs text-gray-500 mt-1">Ningún ítem coincide con tu búsqueda de "{searchTerm}".</p>
        </div>
      )}

      {/* SECCIÓN DE DESCARGA AL FINAL DE LA HOJA */}
      <motion.div
        layout
        className="pt-4 border-t border-gray-100"
      >
        <ReportGenerator />
      </motion.div>
    </div>
  );
};
