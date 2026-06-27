import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Calendar, User, Activity } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/settings/audit');
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const translateAction = (action: string) => {
    switch(action) {
      case 'UPDATE_USER': return 'Actualizó a un Usuario';
      case 'DELETE_USER': return 'Eliminó a un Usuario';
      case 'IMPORT_EXCEL_FORMAT': return 'Importó un Formato Excel';
      case 'UPDATE_SYSTEM_SETTINGS': return 'Modificó la Configuración Global';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Auditoría de Seguridad
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Registro inmutable de todas las acciones administrativas recientes (Últimos 100 movimientos).
            </p>
          </div>
          <button onClick={fetchLogs} className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
            Actualizar Registro
          </button>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 text-red-600 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Acción Realizada</th>
                <th className="px-6 py-4">Detalles (JSON)</th>
                <th className="px-6 py-4">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando registros de seguridad...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay movimientos registrados.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(log.created_at).toLocaleString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <User className="w-4 h-4 text-indigo-500" />
                        @{log.username}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-indigo-700">
                        <Activity className="w-4 h-4" />
                        {translateAction(log.action)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <pre className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded max-w-xs overflow-x-auto">
                        {log.details}
                      </pre>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                      {log.ip_address || 'Local/Oculta'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
