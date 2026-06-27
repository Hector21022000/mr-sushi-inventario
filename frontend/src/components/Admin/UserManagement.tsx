import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, UserCog, UserX, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserData {
  id: number;
  full_name: string;
  username: string;
  role: string;
  status: string;
  area: string | null;
  turno: string | null;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'superadmin' || user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleUpdate = async (id: number, data: Partial<UserData>) => {
    try {
      await axios.put(`/api/auth/users/${id}`, data);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario permanentemente?')) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-96">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-red-600" />
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra accesos, aprueba cuentas pendientes y asigna áreas de trabajo.
          </p>
        </div>
        <button onClick={fetchUsers} className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
          Actualizar Lista
        </button>
      </div>

      {error && (
        <div className="m-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Área Asignada</th>
              <th className="px-6 py-4">Turno Fijo</th>
              {user.role === 'superadmin' && <th className="px-6 py-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando usuarios...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay usuarios registrados.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {u.role === 'superadmin' && <ShieldCheck className="w-4 h-4 text-yellow-500" />}
                      {u.full_name}
                    </div>
                    <div className="text-xs text-gray-400">@{u.username}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <select 
                      disabled={user.role !== 'superadmin' || u.id === user.id}
                      value={u.role}
                      onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                      className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="worker">Trabajador</option>
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <select 
                      disabled={user.role !== 'superadmin' || u.id === user.id}
                      value={u.status}
                      onChange={(e) => handleUpdate(u.id, { status: e.target.value })}
                      className={`border rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:outline-none ${
                        u.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-600' :
                        u.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-600' :
                        'bg-red-50 text-red-700 border-red-200 focus:ring-red-600'
                      }`}
                    >
                      <option value="active">Activa</option>
                      <option value="pending">Pendiente</option>
                      <option value="suspended">Suspendida</option>
                      <option value="deactivated">Desactivada</option>
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <select 
                      disabled={user.role !== 'superadmin'}
                      value={u.area || ''}
                      onChange={(e) => handleUpdate(u.id, { area: e.target.value || null })}
                      className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="">(Sin asignar)</option>
                      <option value="Armado">Armado</option>
                      <option value="Barra">Barra</option>
                      <option value="Cocina">Cocina</option>
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <select 
                      disabled={user.role !== 'superadmin'}
                      value={u.turno || ''}
                      onChange={(e) => handleUpdate(u.id, { turno: e.target.value || null })}
                      className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="">(Sin asignar)</option>
                      <option value="Mañana">Turno Mañana</option>
                      <option value="Tarde">Turno Tarde</option>
                      <option value="Noche">Turno Noche</option>
                    </select>
                  </td>

                  {user.role === 'superadmin' && (
                    <td className="px-6 py-4 text-right">
                      {u.id !== user.id && (
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar usuario"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
