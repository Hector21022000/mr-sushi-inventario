/**
 * Qué hace el archivo: Módulo de Calendario e Historial de Inventarios. Muestra un calendario mensual interactivo para consultar y exportar inventarios cerrados de fechas pasadas.
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { ReportGenerator } from '../Reports/ReportGenerator';
import { type InventoryItem } from '../../context/InventoryContext';

interface HistoryLogSummary {
  id: number;
  uuid: string;
  fecha: string;
  hora: string;
  encargado: string;
  turno: string;
  observaciones: string;
  estado: string;
  area?: string;
  created_at: string;
}

export const HistoryCalendarView: React.FC = () => {
  const [historyList, setHistoryList] = useState<HistoryLogSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<HistoryLogSummary[]>([]);
  const [activeLogDetail, setActiveLogDetail] = useState<{
    uuid: string;
    fecha: string;
    hora: string;
    encargado: string;
    turno: string;
    productos: InventoryItem[];
    responsables?: Record<string, any>;
    estado: string;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({
    Armado: false,
    Barra: false,
    Cocina: false
  });

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get<HistoryLogSummary[]>('/api/inventory/history');
      setHistoryList(res.data);
    } catch (err) {
      console.error('Error fetching inventory history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDateStr(null);
    setSelectedLogs([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDateStr(null);
    setSelectedLogs([]);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes...
  const firstDayIndexAdjusted = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Adaptar a Lunes inicio

  // Generar cuadrícula de días
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndexAdjusted; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Comprobar inventarios para una fecha (formato YYYY-MM-DD)
  const getLogsForDate = (dayNum: number): HistoryLogSummary[] => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const checkDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return historyList.filter((log) => log.fecha === checkDateStr);
  };

  const handleDayClick = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    
    const logs = getLogsForDate(dayNum);
    setSelectedDateStr(dateStr);
    setSelectedLogs(logs);
    setActiveLogDetail(null);
  };

  const loadLogDetail = async (uuid: string) => {
    try {
      setLoadingDetail(true);
      const res = await axios.get(`/api/inventory/history/${uuid}`);
      setActiveLogDetail(res.data);
    } catch (err) {
      console.error('Error loading log detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Contenedor Principal de Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendario Mensual */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Historial de Inventarios
              </h3>
              <p className="text-xs text-gray-500">
                Seleccione un día del calendario para consultar los inventarios guardados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wider min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <span key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                {d}
              </span>
            ))}
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 rounded-xl"></div>;
              }

              const logs = getLogsForDate(day);
              const hasLogs = logs.length > 0;
              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const checkDateStr = `${year}-${formattedMonth}-${formattedDay}`;
              const isSelected = selectedDateStr === checkDateStr;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-xl border transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600 font-bold shadow-sm shadow-red-100 scale-105'
                      : hasLogs
                      ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50 text-gray-800 font-semibold'
                      : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {hasLogs && (
                    <span className="absolute bottom-1.5 flex gap-0.5">
                      {logs.map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral de Sesiones */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h4 className="font-extrabold text-gray-900 text-sm mb-4 uppercase tracking-wider">
            Inventarios del Día
          </h4>
          
          {selectedDateStr ? (
            <div className="flex-1 space-y-4">
              <div className="p-3 bg-red-50/50 border border-red-100/50 rounded-2xl text-xs text-red-600 font-bold text-center">
                Fecha seleccionada: {selectedDateStr}
              </div>
              
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <div className="w-6 h-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin mb-2"></div>
                  <p className="text-xs font-semibold text-gray-600">Cargando sesiones...</p>
                </div>
              ) : selectedLogs.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                  {['Armado', 'Barra', 'Cocina'].map((areaName) => {
                    const areaLogs = selectedLogs.filter((log) => {
                      const logArea = log.area || 'Armado';
                      return logArea.toLowerCase() === areaName.toLowerCase();
                    });
                    const isCollapsed = collapsedAreas[areaName] ?? false;

                    return (
                      <div key={areaName} className="space-y-2 border-b border-gray-100 pb-3 last:border-b-0">
                        {/* Cabecera del Módulo */}
                        <button
                          onClick={() => setCollapsedAreas(prev => ({ ...prev, [areaName]: !prev[areaName] }))}
                          className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded-xl text-left cursor-pointer"
                        >
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            {areaName} ({areaLogs.length})
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>

                        {/* Lista de Registros */}
                        {!isCollapsed && (
                          <div className="pl-3 space-y-2">
                            {areaLogs.length > 0 ? (
                              areaLogs.map((log) => (
                                <button
                                  key={log.uuid}
                                  onClick={() => loadLogDetail(log.uuid)}
                                  className={`w-full text-left p-2.5 px-3 border rounded-xl transition-all flex items-center justify-between hover:border-red-300 hover:bg-red-50/10 cursor-pointer ${
                                    activeLogDetail?.uuid === log.uuid
                                      ? 'border-red-500 bg-red-50/30 shadow-xs font-bold'
                                      : 'border-gray-100 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700">
                                      • <strong className="text-gray-900">{log.encargado}</strong> — Turno {log.turno}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {log.hora}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="text-[10px] text-gray-400 italic pl-5">Sin registros en este módulo</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  <FileText className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-xs font-bold text-gray-700">Sin Registros</p>
                  <p className="text-[10px] text-gray-400 px-4 mt-1">
                    No se guardaron inventarios históricos para esta fecha.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <Calendar className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-xs font-bold text-gray-700">Selecciona una fecha</p>
              <p className="text-[10px] text-gray-400 px-6 mt-1">
                Haz clic en cualquier día con indicadores de color en el calendario para ver las sesiones.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visualizador de Detalle del Inventario Histórico */}
      <AnimatePresence>
        {loadingDetail ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin mb-2"></div>
            <span>Cargando detalle del inventario histórico...</span>
          </div>
        ) : activeLogDetail ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden"
          >
            {/* Cabecera del visualizador */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                    Consulta Histórica: Turno {activeLogDetail.turno}
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      {activeLogDetail.estado}
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Responsable: {activeLogDetail.encargado} | Fecha: {activeLogDetail.fecha} - {activeLogDetail.hora}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLogDetail(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tablas de Inventario Histórico en Modo Lectura */}
            <div className="p-6 space-y-6">
              {/* Reportes y Exportación */}
              <div className="bg-red-50/30 border border-red-100/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                    Exportar Reporte de esta Fecha
                  </h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Descargue el informe en PDF, Imagen o Excel firmado por {activeLogDetail.encargado}.
                  </p>
                </div>
                {/* Proveemos una versión de ReportGenerator sobreescribiendo el encargado/turno con los del log histórico */}
                <div>
                  <ReportGenerator 
                    historicalData={activeLogDetail.productos} 
                    historicalMeta={{
                      encargado: activeLogDetail.encargado,
                      turno: activeLogDetail.turno,
                      fecha: activeLogDetail.fecha,
                      hora: activeLogDetail.hora,
                      responsables: activeLogDetail.responsables
                    }}
                  />
                </div>
              </div>

              {/* Contenedor de Tablas de Lectura */}
              <div className="space-y-6">
                {['cajas', 'salseros', 'utensilios', 'gaseosas'].map((sectionType) => {
                  const items = activeLogDetail.productos.filter((item) => {
                    if (sectionType === 'cajas') return item.category.startsWith('cajas');
                    return item.category === sectionType;
                  });

                  if (items.length === 0) return null;

                  const sectionLabels: Record<string, string> = {
                    cajas: 'CAJAS X MAKI (Cajas)',
                    salseros: 'SALSEROS (Contenedores)',
                    utensilios: 'UTENSILIOS DE ARMADO (Empaque)',
                    gaseosas: 'GASEOSAS (Bebidas)'
                  };

                  return (
                    <div key={sectionType} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                        <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                          {sectionLabels[sectionType]}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Producto</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Medida</th>
                              {sectionType === 'cajas' ? (
                                <>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Desarmadas</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Armadas</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">TOTAL</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Consumido</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Merma</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Cierre</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Comentarios</th>
                                </>
                              ) : sectionType === 'acevichado' ? (
                                <>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">S. Inicial</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Ingreso</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">TOTAL</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Producción</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Restante</th>
                                </>
                              ) : sectionType === 'salseros' ? (
                                <>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">S. Inicial</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Ingreso</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">TOTAL</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Consumido</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">S. Final</th>
                                </>
                              ) : (
                                <>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">S. Inicial</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Ingreso</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">TOTAL</th>
                                  <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">S. Final</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs">
                            {items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50/20">
                                <td className="p-3 font-bold text-gray-800">{item.name}</td>
                                <td className="p-3 text-gray-400 font-semibold">{item.measure}</td>
                                {sectionType === 'cajas' ? (
                                  <>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.cajas_desarmadas}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.cajas_armadas}</td>
                                    <td className="p-3 text-center font-bold text-gray-900">{item.total}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.consumido}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.merma}</td>
                                    <td className="p-3 text-center font-bold text-red-600">{item.cierre_turno}</td>
                                    <td className="p-3 text-gray-500 italic max-w-[200px] truncate">{item.comentarios || '-'}</td>
                                  </>
                                ) : sectionType === 'acevichado' ? (
                                  <>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.s_inicial}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.ingreso}</td>
                                    <td className="p-3 text-center font-bold text-gray-900">{item.total}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.produccion}</td>
                                    <td className="p-3 text-center font-bold text-red-600">{item.restante}</td>
                                  </>
                                ) : sectionType === 'salseros' ? (
                                  <>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.s_inicial}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.ingreso}</td>
                                    <td className="p-3 text-center font-bold text-gray-900">{item.total}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.consumido}</td>
                                    <td className="p-3 text-center font-bold text-red-600">{item.s_final}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.s_inicial}</td>
                                    <td className="p-3 text-center font-medium text-gray-600">{item.ingreso}</td>
                                    <td className="p-3 text-center font-bold text-gray-900">{item.total}</td>
                                    <td className="p-3 text-center font-bold text-red-600">{item.s_final}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
