import React, { useState } from 'react';
import { Settings, Save, Power, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const SystemSettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  
  // Estado local para los toggles antes de guardar
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const toggleSetting = (key: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(localSettings);
      setMessage({ text: 'Configuraciones guardadas exitosamente', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Error al guardar configuraciones', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              Configuración Global
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Controla qué módulos y funciones están disponibles en la plataforma para todos los usuarios.
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta de Interruptor */}
          <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${localSettings['module_cocina_enabled'] === 'true' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Módulo: Inventario Cocina</h3>
                <p className="text-sm text-gray-500">Muestra el área de cocina en la barra lateral.</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('module_cocina_enabled')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${localSettings['module_cocina_enabled'] === 'true' ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings['module_cocina_enabled'] === 'true' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Tarjeta de Interruptor */}
          <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${localSettings['module_barra_enabled'] === 'true' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Módulo: Inventario Barra</h3>
                <p className="text-sm text-gray-500">Muestra el área de barra en la barra lateral.</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('module_barra_enabled')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${localSettings['module_barra_enabled'] === 'true' ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings['module_barra_enabled'] === 'true' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Tarjeta de Interruptor */}
          <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${localSettings['module_reports_enabled'] === 'true' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Módulo: Reportes y Auditoría</h3>
                <p className="text-sm text-gray-500">Permite a los administradores descargar reportes Excel.</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting('module_reports_enabled')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${localSettings['module_reports_enabled'] === 'true' ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings['module_reports_enabled'] === 'true' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

        </div>

        <h3 className="text-xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" />
          Columnas de Inventario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'col_ingreso_enabled', label: 'Ingreso', desc: 'Ingreso de productos durante el día' },
            { key: 'col_consumido_enabled', label: 'Consumido', desc: 'Gasto de productos (Merma/Consumo)' },
            { key: 'col_merma_enabled', label: 'Merma', desc: 'Pérdida por accidentes o fallas' },
            { key: 'col_produccion_enabled', label: 'Producción', desc: 'Producción del día' },
            { key: 'col_req_enabled', label: 'Requerimiento', desc: 'Cálculo de pedidos a proveedor' },
            { key: 'col_comentarios_enabled', label: 'Comentarios', desc: 'Caja de texto de observaciones' },
          ].map((col) => (
            <div key={col.key} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-indigo-200 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{col.label}</h4>
                <p className="text-xs text-gray-500">{col.desc}</p>
              </div>
              <button 
                onClick={() => toggleSetting(col.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${localSettings[col.key] !== 'false' ? 'bg-indigo-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings[col.key] !== 'false' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
