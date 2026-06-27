import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle } from 'lucide-react';

export const FormatManagementView: React.FC = () => {
  const [formats, setFormats] = useState<{area: string, activeProducts: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('Armado');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const fetchFormats = async () => {
    try {
      const res = await axios.get('/api/formats');
      setFormats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormats();
  }, []);

  const handleDownloadTemplate = () => {
    window.location.href = '/api/formats/template';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!confirm(`¿Estás seguro de reemplazar el formato actual de ${selectedArea}? Esto activará el nuevo formato inmediatamente, pero mantendrá tu historial de fotos diarias intacto.`)) return;

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('area', selectedArea);
    formData.append('file', file);

    try {
      const res = await axios.post('/api/formats/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: res.data.message, type: 'success' });
      setFile(null);
      fetchFormats(); // recargar
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Error al subir', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              Gestión Dinámica de Formatos
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Sube tus plantillas de Excel para actualizar automáticamente los productos, categorías y unidades de medida de cada área sin afectar el historial pasado.
            </p>
          </div>
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar Plantilla Vacía
          </button>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zona de Subida */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 flex flex-col items-center justify-center text-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            
            <div className="w-full max-w-xs mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">1. Selecciona el Área a Actualizar</label>
              <select 
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:outline-none"
              >
                <option value="Armado">Armado</option>
                <option value="Cocina">Cocina</option>
                <option value="Barra">Barra</option>
              </select>
            </div>

            <div className="w-full max-w-xs">
              <label className="block text-sm font-bold text-gray-700 mb-2">2. Sube tu archivo Excel (.xlsx)</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-6 w-full max-w-xs px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? 'Procesando...' : 'Reemplazar Formato'}
            </button>
          </div>

          {/* Resumen Actual */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Formatos Activos en el Sistema</h3>
            {loading ? (
              <p className="text-gray-400">Cargando...</p>
            ) : formats.length === 0 ? (
              <p className="text-gray-400">No hay formatos personalizados activos.</p>
            ) : (
              <ul className="space-y-3">
                {formats.map((f, i) => (
                  <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="font-bold text-gray-800">Área: {f.area}</span>
                    <span className="text-sm px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full">
                      {f.activeProducts} Productos
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="font-bold text-blue-900 text-sm mb-1">Nota del Sistema</h4>
              <p className="text-xs text-blue-700">
                Al subir un nuevo formato para un área, todos los productos anteriores de esa área se ocultarán y los nuevos empezarán con stock 0. Tus registros históricos (Inventarios pasados) no se verán afectados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
