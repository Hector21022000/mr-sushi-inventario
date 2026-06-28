/**
 * Qué hace el archivo: Componente que permite a los usuarios actualizar su información personal (Nombre y Contraseña).
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { user, updateUserSession } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put('/api/auth/profile', {
        fullName,
        password: password || undefined,
      });

      updateUserSession({ fullName: response.data.user.fullName });
      setSuccess('Perfil actualizado exitosamente.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
          <div className="bg-blue-50 p-2.5 rounded-xl">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mi Perfil</h2>
            <p className="text-sm text-gray-500">Actualiza tus datos personales y credenciales de acceso</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de Usuario (Login)</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">El nombre de usuario no se puede cambiar.</p>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-gray-500" />
                Cambiar Contraseña
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiar"
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
