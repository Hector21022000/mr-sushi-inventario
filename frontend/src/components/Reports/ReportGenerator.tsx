/**
 * Qué hace el archivo: Componente de Exportación de Reportes. Genera descargas en JPG (Full HD), PNG, PDF y Excel, renderizando un informe ejecutivo estructurado con el logo y KPIs.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { useRef, useState } from 'react';
import { useInventory, type InventoryItem } from '../../context/InventoryContext';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Download, FileImage, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface ReportGeneratorProps {
  historicalData?: InventoryItem[];
  historicalMeta?: {
    encargado: string;
    turno: string;
    fecha: string;
    hora: string;
    responsables?: Record<string, any> | null;
  };
}

const getStatsAndCriticals = (items: InventoryItem[]) => {
  let suficiente = 0;
  let medio = 0;
  let bajo = 0;
  let critico = 0;
  let sinStock = 0;
  
  const criticals = items.filter((item) => {
    if (item.category === 'cajas_1' || item.category === 'cajas_2') {
      return item.total < 50;
    }
    if (item.category === 'gaseosas') {
      return item.total <= 2;
    }
    return false;
  });

  items.forEach((item) => {
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
    stats: { totalProducts: items.length, suficiente, medio, bajo, critico, sinStock },
    criticalItems: criticals
  };
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  historicalData,
  historicalMeta
}) => {
  const { inventory, stats: currentStats, responsable: currentResponsable, turno: currentTurno, responsables: currentResponsables } = useInventory();
  const [exporting, setExporting] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Seleccionar conjunto de datos a exportar (histórico o actual)
  const activeData = historicalData || inventory;

  // Calcular stats en base al conjunto activo
  const stats = historicalData
    ? getStatsAndCriticals(historicalData).stats
    : currentStats;

  // Metadatos de la firma del reporte
  const reportMeta = historicalMeta || {
    encargado: currentResponsable || 'Responsable',
    turno: currentTurno || 'No especificado',
    fecha: new Date().toLocaleDateString('es-PE'),
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    responsables: currentResponsables
  };

  const getFormattedDateTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    return {
      fileName: `${yyyy}-${mm}-${dd}_${hh}-${min}`,
      title: `${dd}/${mm}/${yyyy} ${hh}:${min}`
    };
  };

  // Exportar Excel usando SheetJS
  const exportToExcel = async () => {
    setExporting('excel');
    try {
      // 1. Hoja de Inventario Completo
      const inventoryData = activeData.map(item => ({
        Categoria: item.category === 'cajas_1' ? 'Cajas 1er Turno' :
                   item.category === 'cajas_2' ? 'Cajas 2do Turno' :
                   item.category === 'acevichado' ? 'Acevichados' :
                   item.category === 'salseros' ? 'Salseros' :
                   item.category === 'utensilios' ? 'Utensilios de Armado' : 'Gaseosas',
        Producto: item.name,
        Medida: item.measure,
        'Cajas Desarmadas': item.category.startsWith('cajas') ? item.cajas_desarmadas : '-',
        'Cajas Armadas': item.category.startsWith('cajas') ? item.cajas_armadas : '-',
        'Stock Inicial': !item.category.startsWith('cajas') ? item.s_inicial : '-',
        'Ingresos': !item.category.startsWith('cajas') ? item.ingreso : '-',
        TOTAL: item.total,
        Consumido: (item.category.startsWith('cajas') || item.category === 'salseros') ? item.consumido : '-',
        Produccion: item.category === 'acevichado' ? item.produccion : '-',
        Restante: item.category === 'acevichado' ? item.restante : '-',
        'Stock Final': (item.category === 'salseros' || item.category === 'utensilios' || item.category === 'gaseosas') ? item.s_final : '-',
        Merma: item.category.startsWith('cajas') ? item.merma : '-',
        Requerimiento: item.requerimiento,
        Comentarios: item.comentarios || ''
      }));

      const wb = XLSX.utils.book_new();
      const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario');

      // 2. Hoja de Resumen (KPIs)
      const summaryData = [
        { Indicador: 'Total de Productos', Cantidad: stats.totalProducts },
        { Indicador: 'Stock Suficiente (Verde)', Cantidad: stats.suficiente },
        { Indicador: 'Stock Medio (Amarillo)', Cantidad: stats.medio },
        { Indicador: 'Stock Bajo / Reposición (Naranja)', Cantidad: stats.bajo },
        { Indicador: 'Stock Crítico (Rojo)', Cantidad: stats.critico },
        { Indicador: 'Sin Stock (Agotado)', Cantidad: stats.sinStock },
        { Indicador: 'Encargado Turno Mañana', Cantidad: reportMeta.responsables?.Mañana?.encargado || '-' },
        { Indicador: 'Encargado Turno Tarde', Cantidad: reportMeta.responsables?.Tarde?.encargado || '-' },
        { Indicador: 'Encargado Turno Noche', Cantidad: reportMeta.responsables?.Noche?.encargado || '-' },
        { Indicador: 'Cierre Definitivo Por', Cantidad: reportMeta.encargado },
        { Indicador: 'Fecha del Cierre', Cantidad: reportMeta.fecha },
        { Indicador: 'Hora del Cierre', Cantidad: reportMeta.hora }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen KPIs');

      const { fileName } = getFormattedDateTime();
      const finalFileName = `Inventario_MR_SUSHI_${fileName}.xlsx`;

      try {
        XLSX.writeFile(wb, finalFileName);
      } catch (e) {
        console.warn('Descarga nativa bloqueada por sandbox, se guardará en el servidor.');
      }

      const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      await axios.post('/api/save-report', {
        fileName: finalFileName,
        base64Data,
        format: 'xlsx'
      });
      setSaveNotification(finalFileName);

    } catch (error: any) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar Excel: ' + error.message);
    } finally {
      setExporting(null);
    }
  };

  // Exportar Imagen (JPG / PNG) o PDF usando html2canvas + jsPDF
  const exportAsMedia = async (format: 'jpg' | 'png' | 'pdf') => {
    setExporting(format);
    
    // Esperar un instante para asegurar que la estructura esté en el DOM
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const element = reportRef.current;
    if (!element) {
      alert('Error: No se encontró la plantilla de reporte en el DOM.');
      setExporting(null);
      return;
    }

    try {
      // Configuraciones de renderizado para Alta Resolución
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 2, // Escala de 2 para excelente nitidez de texto (Full HD+)
        logging: false,
        backgroundColor: '#FFFFFF'
      });

      const imgData = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, 0.95);
      const { fileName } = getFormattedDateTime();
      const finalFileName = `Inventario_MR_SUSHI_${fileName}.${format}`;

      let fileData = imgData;

      if (format === 'pdf') {
        // PDF en formato A4 apaisado (Landscape)
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgWidth = 297; // A4 ancho landscape en mm
        const pageHeight = 210; // A4 alto landscape en mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Si el reporte excede una página, crear páginas adicionales
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        fileData = pdf.output('datauristring');

        // Intentar descarga nativa del PDF
        try {
          pdf.save(finalFileName);
        } catch (e) {
          console.warn('Descarga de PDF bloqueada por sandbox.');
        }
      } else {
        // Intentar descarga nativa de Imagen
        try {
          const link = document.createElement('a');
          link.style.display = 'none';
          document.body.appendChild(link);
          link.download = finalFileName;
          link.href = imgData;
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.warn('Descarga de imagen bloqueada por sandbox.');
        }
      }

      // Guardar en el disco local
      await axios.post('/api/save-report', {
        fileName: finalFileName,
        base64Data: fileData,
        format
      });
      setSaveNotification(finalFileName);

    } catch (error: any) {
      console.error(`Error al exportar a ${format}:`, error);
      alert(`Error al exportar a ${format}: ` + error.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notificación de Guardado */}
      {saveNotification && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between text-sm">
          <span>Archivo guardado exitosamente: <strong>{saveNotification}</strong></span>
          <button onClick={() => setSaveNotification(null)} className="font-bold underline">Cerrar</button>
        </div>
      )}

      {/* Botones de acción */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-red-600" />
          Exportar Informes y Reportes
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* JPG */}
          <button
            onClick={() => exportAsMedia('jpg')}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {exporting === 'jpg' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileImage className="w-4 h-4" />
            )}
            Descargar JPG (HD)
          </button>

          {/* PNG */}
          <button
            onClick={() => exportAsMedia('png')}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {exporting === 'png' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileImage className="w-4 h-4" />
            )}
            Descargar PNG
          </button>

          {/* PDF */}
          <button
            onClick={() => exportAsMedia('pdf')}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Descargar PDF
          </button>

          {/* Excel */}
          <button
            onClick={exportToExcel}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {exporting === 'excel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Descargar Excel
          </button>
        </div>
      </div>

      {/* PLANTILLA DE INFORME EJECUTIVO OCULTO (Optimizado para captura A4 Landscape w-1280px) */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div
          ref={reportRef}
          className="w-[1280px] bg-white p-6 flex flex-col justify-between font-sans border border-gray-200 space-y-4"
        >
          {/* Cabecera Corporativa */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            {/* Izquierda: Logo y Texto Marca */}
            <div className="flex items-center gap-4">
              <img src={logoImg} alt="MR-SUSHI Logo" className="h-10 w-10 object-contain rounded-lg shrink-0" />
              <div>
                <h1 className="text-lg font-extrabold text-[#0B1B3D] tracking-tight">MR-SUSHI</h1>
                <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest leading-none">Sistema Inteligente de Control de Inventario</p>
              </div>
            </div>

            {/* Centro: Título */}
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-900 tracking-wider uppercase">REPORTE DE INVENTARIO DIARIO</h2>
            </div>

            {/* Derecha: Número de Reporte */}
            <div>
              <div className="border border-gray-300 bg-gray-50/50 px-3 py-1 rounded-lg text-xs font-bold text-gray-700 tracking-wider">
                REPORTE N°: {reportMeta.fecha.replace(/\//g, '-')}-001
              </div>
            </div>
          </div>

          {/* Barra de Metadatos (Diseño continuo de celdas Excel) */}
          <div className="grid grid-cols-4 border border-gray-300 rounded-lg overflow-hidden divide-x divide-gray-300 text-xs font-semibold bg-gray-50/50">
            <div className="py-2 px-4 flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">📅</span>
              <span>Fecha:</span>
              <strong className="text-gray-900 font-bold ml-1">{reportMeta.fecha}</strong>
            </div>
            <div className="py-2 px-4 flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">⏰</span>
              <span>Hora:</span>
              <strong className="text-gray-900 font-bold ml-1">{reportMeta.hora}</strong>
            </div>
            <div className="py-2 px-4 flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">👤</span>
              <span>Responsable:</span>
              <strong className="text-gray-900 font-bold ml-1 truncate">{reportMeta.encargado}</strong>
            </div>
            <div className="py-2 px-4 flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">👥</span>
              <span>Turno:</span>
              <strong className="text-gray-900 font-bold ml-1">{reportMeta.turno}</strong>
            </div>
          </div>

          {/* Listado de Tablas Consecutivas en Estructura Excel */}
          <div className="space-y-4 flex-grow">
            {[
              { id: 'cajas_1', label: '1. CAJAS (1ER TURNO)', type: 'cajas' },
              { id: 'cajas_2', label: '2. CAJAS (2DO TURNO)', type: 'cajas' },
              { id: 'salseros', label: '3. SALSEROS', type: 'salseros' },
              { id: 'utensilios', label: '4. UTENSILIOS DE ARMADO', type: 'utensilios' },
              { id: 'gaseosas', label: '5. GASEOSAS', type: 'gaseosas' }
            ].map((section) => {
              // Filtrar productos correspondientes a la sección
              const sectionItems = activeData.filter(item => {
                if (section.id.startsWith('cajas')) return item.category === section.id;
                return item.category === section.id;
              });

              if (sectionItems.length === 0) return null;

              const isCaja = section.type === 'cajas';
              const isAcevichado = section.type === 'acevichado';

              return (
                <div key={section.id} className="space-y-1">
                  {/* Título de la Sección */}
                  <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-wide">
                    {section.label}
                  </h3>

                  {/* Cuadrícula de Tabla Estilo Excel */}
                  <table className="w-full text-left border-collapse border border-gray-300 text-xs font-medium">
                    <thead>
                      <tr className="bg-[#0B1B3D] text-white uppercase font-bold text-[10px]">
                        <th className="p-1.5 border border-gray-300 pl-3">Producto</th>
                        <th className="p-1.5 border border-gray-300 text-center w-16">Medida</th>
                        {isCaja ? (
                          <>
                            <th className="p-1.5 border border-gray-300 text-center w-36">S. Inicial (Desarmadas)</th>
                            <th className="p-1.5 border border-gray-300 text-center w-32">Ingreso (Armadas)</th>
                            <th className="p-1.5 border border-gray-300 text-center w-20">Total</th>
                            <th className="p-1.5 border border-gray-300 text-center w-24">Producción</th>
                            <th className="p-1.5 border border-gray-300 text-center w-20">Restante</th>
                            <th className="p-1.5 border border-gray-300 text-center w-20">S. Final</th>
                          </>
                        ) : (
                          <>
                            <th className="p-1.5 border border-gray-300 text-center w-36">S. Inicial</th>
                            <th className="p-1.5 border border-gray-300 text-center w-32">Ingreso</th>
                            <th className="p-1.5 border border-gray-300 text-center w-20">Total</th>
                            <th className="p-1.5 border border-gray-300 text-center w-24">Consumo</th>
                            <th className="p-1.5 border border-gray-300 text-center w-20">S. Final</th>
                          </>
                        )}
                        <th className="p-1.5 border border-gray-300 text-center w-72">Requerimiento</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {sectionItems.map((item, idx) => {
                        // Determinar los estilos de requerimiento
                        const reqVal = item.requerimiento || 'No requiere';
                        const reqLower = reqVal.toLowerCase();
                        let reqClass = 'bg-[#2E7D32] text-white';
                        let reqText = 'No requiere reposición';

                        if (reqLower.includes('urgente') || reqLower.includes('crítico') || reqLower.includes('agotado') || item.total === 0) {
                          reqClass = 'bg-[#C62828] text-white';
                          reqText = 'Producto agotado. Requiere reposición inmediata';
                        } else if (reqLower.includes('comprar') || reqLower.includes('requiere cajas') || reqLower.includes('reposición') || reqLower.includes('bajo')) {
                          reqClass = 'bg-[#FBC02D] text-gray-900';
                          reqText = 'Requiere reposición (stock bajo)';
                        }

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-1 border border-gray-200 pl-3 font-bold text-gray-900">{item.name}</td>
                            <td className="p-1 border border-gray-200 text-center text-gray-500 font-semibold uppercase">{item.measure}</td>
                            {isCaja ? (
                              <>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.cajas_desarmadas}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.cajas_armadas}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-900 font-extrabold">{item.total}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.consumido}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.cierre_turno}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-900 font-bold">{item.cierre_turno}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.s_inicial}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">{item.ingreso}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-900 font-extrabold">{item.total}</td>
                                <td className="p-1 border border-gray-200 text-center text-gray-800 font-medium">
                                  {isAcevichado ? item.produccion : item.consumido}
                                </td>
                                <td className="p-1 border border-gray-200 text-center text-gray-900 font-bold">
                                  {isAcevichado ? item.restante : item.s_final}
                                </td>
                              </>
                            )}
                            <td className={`${reqClass} border border-gray-200 text-center font-bold text-[9px] uppercase tracking-wider py-1 px-2`}>
                              {reqText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Pie de Página del Reporte Corto */}
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
            <div>
              <span>© {new Date().getFullYear()} MR-SUSHI S.A.C. Todos los derechos reservados.</span>
            </div>
            <div>
              <span>Generado por el Sistema Inteligente de Control de Inventario</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
