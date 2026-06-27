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
import { Download, FileImage, FileText, FileSpreadsheet, Loader2, Check } from 'lucide-react';
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
  const { inventory, stats: currentStats, criticalItems: currentCriticals, responsable: currentResponsable, turno: currentTurno, responsables: currentResponsables } = useInventory();
  const [exporting, setExporting] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Seleccionar conjunto de datos a exportar (histórico o actual)
  const activeData = historicalData || inventory;

  // Calcular stats y criticals en base al conjunto activo
  const { stats, criticalItems } = historicalData
    ? getStatsAndCriticals(historicalData)
    : { stats: currentStats, criticalItems: currentCriticals };

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
        // PDF en formato A4 apaisado o vertical dependiendo de las proporciones del canvas
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 ancho en mm
        const pageHeight = 295; // A4 alto en mm
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

      {/* PLANTILLA DE INFORME EJECUTIVO OCULTO (Renderizado fuera del área visible para html2canvas) */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div
          ref={reportRef}
          className="w-[1920px] bg-white p-12 flex flex-col justify-between font-sans"
          style={{ minHeight: '1080px' }}
        >
          {/* Cabecera Corporativa */}
          <div className="flex justify-between items-center border-b-4 border-[#E30613] pb-8">
            <div className="flex items-center gap-6">
              <img src={logoImg} alt="MR SUSHI" className="h-20 object-contain" />
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MR·SUSHI</h1>
                <p className="text-lg font-bold text-[#E30613] tracking-widest uppercase">Sistema Inteligente de Control de Inventario</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-red-50 text-[#E30613] text-xs font-bold uppercase px-3 py-1 rounded-full border border-red-100 mb-2">Reporte Ejecutivo Oficial</span>
              <p className="text-sm font-medium text-gray-500">Fecha: <strong className="text-gray-900">{reportMeta.fecha}</strong></p>
              <p className="text-sm font-medium text-gray-500">Hora: <strong className="text-gray-900">{reportMeta.hora}</strong></p>
              <p className="text-sm font-medium text-gray-500">Encargado: <strong className="text-gray-900">{reportMeta.encargado}</strong></p>
              <p className="text-sm font-medium text-gray-500">Turno: <strong className="text-gray-900">{reportMeta.turno}</strong></p>
            </div>
          </div>

          {/* Resumen General KPIs y Productos Críticos */}
          <div className="grid grid-cols-3 gap-8 my-8">
            {/* Tarjetas Resumen */}
            <div className="col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Resumen de Stock</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.totalProducts}</span>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Productos</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-3xl font-extrabold text-emerald-600">{stats.suficiente}</span>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Suficientes</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-3xl font-extrabold text-amber-500">{stats.medio}</span>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Medios</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-3xl font-extrabold text-orange-500">{stats.bajo}</span>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Bajos</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-red-600 font-bold">Críticos: {stats.critico}</span>
                <span className="text-red-900 font-bold">Sin Stock: {stats.sinStock}</span>
              </div>
            </div>

            {/* Listado de Compras Críticas Urgentes */}
            <div className="col-span-2 bg-red-50/30 p-6 rounded-3xl border border-red-100/50 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-red-800 mb-4 border-b border-red-100 pb-2 flex items-center gap-2">
                  <Check className="w-5 h-5 text-red-600" />
                  Compras Requeridas Inmediatas (Stock ≤ 2)
                </h3>
                {criticalItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-h-40 overflow-hidden">
                    {criticalItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-red-100/30">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-xs">Total: {item.total} {item.measure}</span>
                          <span className="text-xs font-semibold text-red-800">{item.requerimiento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-700 font-semibold my-4">✓ No se registran requerimientos críticos. ¡Inventario al día!</p>
                )}
              </div>
              <p className="text-[11px] text-red-900/60 mt-4 italic">* Los requerimientos se generan de forma automática según la lógica establecida en la base de verdad (Excel).</p>
            </div>
          </div>

          {/* Tabla de Inventario Detallada (Agrupada por Categorías principales) */}
          <div className="space-y-6 flex-grow">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-2">Tabla Detallada de Inventario</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-white uppercase font-bold">
                  <th className="p-3">Sección</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Medida</th>
                  <th className="p-3 text-right">Inicial / Desarmadas</th>
                  <th className="p-3 text-right">Ingreso / Armadas</th>
                  <th className="p-3 text-center">TOTAL</th>
                  <th className="p-3 text-right">Consumo / Producción</th>
                  <th className="p-3 text-right">Cierre / Stock Final</th>
                  <th className="p-3">Requerimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeData.map((item, idx) => {
                  const isCaja = item.category.startsWith('cajas');
                  const isAcevichado = item.category === 'acevichado';
                  
                  // Color del total
                  let colorClass = 'text-gray-900 font-semibold';
                  if (item.total >= 10) colorClass = 'text-emerald-600 font-bold';
                  else if (item.total >= 5) colorClass = 'text-amber-500 font-semibold';
                  else if (item.total >= 3) colorClass = 'text-orange-500 font-semibold';
                  else colorClass = 'text-red-600 font-bold';

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 font-bold text-gray-500">
                        {item.category === 'cajas_1' ? 'Cajas T1' :
                         item.category === 'cajas_2' ? 'Cajas T2' :
                         item.category === 'acevichado' ? 'Acevichado' :
                         item.category === 'salseros' ? 'Salseros' :
                         item.category === 'utensilios' ? 'Utensilios' : 'Gaseosas'}
                      </td>
                      <td className="p-2 font-bold text-gray-900">{item.name}</td>
                      <td className="p-2 text-gray-400 font-medium">{item.measure}</td>
                      
                      {/* Inicial / Desarmadas */}
                      <td className="p-2 text-right text-gray-700">
                        {isCaja ? item.cajas_desarmadas : item.s_inicial}
                      </td>
                      
                      {/* Ingreso / Armadas */}
                      <td className="p-2 text-right text-gray-700">
                        {isCaja ? item.cajas_armadas : item.ingreso}
                      </td>

                      {/* TOTAL */}
                      <td className="p-2 text-center">
                        <span className={colorClass}>{item.total}</span>
                      </td>

                      {/* Consumo / Producción */}
                      <td className="p-2 text-right text-gray-700">
                        {isCaja ? item.consumido :
                         isAcevichado ? item.produccion :
                         item.category === 'salseros' ? item.consumido : '-'}
                      </td>

                      {/* Cierre / Stock Final */}
                      <td className="p-2 text-right font-bold text-gray-900">
                        {isCaja ? item.cierre_turno :
                         isAcevichado ? item.restante : item.s_final}
                      </td>

                      {/* Requerimiento */}
                      <td className="p-2">
                        <span className={`font-semibold ${item.total <= 2 ? 'text-red-600' : 'text-gray-600'}`}>
                          {item.requerimiento || 'No requiere'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pie de Página del Reporte Firmado */}
          <div className="border-t-2 border-gray-200 pt-6 mt-8 flex flex-col md:flex-row justify-between items-start text-xs text-gray-400 gap-6">
            <div>
              <p className="font-semibold text-gray-600">© {new Date().getFullYear()} MR·SUSHI S.A.C. Todos los derechos reservados.</p>
              <p className="text-[10px] text-gray-400 mt-1">Generado por el Sistema Inteligente de Control de Inventario acumulado diario.</p>
            </div>
            
            {/* Firmas y responsables por turno */}
            <div className="flex flex-wrap gap-6 text-gray-800 text-xs font-semibold">
              <div className="flex flex-col p-3 bg-gray-50 border border-gray-100 rounded-xl min-w-[120px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Turno Mañana</span>
                <span className="text-gray-700 font-bold mt-1 truncate">{reportMeta.responsables?.Mañana?.encargado || 'No registrado'}</span>
                <span className="text-[10px] text-gray-400 font-semibold">{reportMeta.responsables?.Mañana?.ingreso ? `Ingreso: ${reportMeta.responsables.Mañana.ingreso}` : '-'}</span>
              </div>
              <div className="flex flex-col p-3 bg-gray-50 border border-gray-100 rounded-xl min-w-[120px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Turno Tarde</span>
                <span className="text-gray-700 font-bold mt-1 truncate">{reportMeta.responsables?.Tarde?.encargado || 'No registrado'}</span>
                <span className="text-[10px] text-gray-400 font-semibold">{reportMeta.responsables?.Tarde?.ingreso ? `Ingreso: ${reportMeta.responsables.Tarde.ingreso}` : '-'}</span>
              </div>
              <div className="flex flex-col p-3 bg-red-50 border border-red-100 rounded-xl min-w-[140px]">
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider block">Cierre Definitivo</span>
                <span className="text-red-700 font-bold mt-1 truncate">{reportMeta.encargado} (Turno {reportMeta.turno})</span>
                <span className="text-[10px] text-red-500 font-semibold">Cierre: {reportMeta.fecha} {reportMeta.hora}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
