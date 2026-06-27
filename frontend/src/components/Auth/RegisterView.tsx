import React, { useState } from 'react';
import { User, Lock, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import logoImg from '../../assets/logo.png';

export const RegisterView: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialCode, setSpecialCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/register', { 
        fullName, 
        username, 
        password, 
        specialCode: specialCode.trim() || undefined 
      });

      setSuccess('Cuenta creada exitosamente. ' + (res.data.status === 'pending' ? 'Tu cuenta está pendiente de asignación por un administrador.' : ''));
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-sm border border-gray-100 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">¡Registro Completado!</h2>
          <p className="text-gray-500 font-medium">{success}</p>
          <p className="text-sm text-gray-400 mt-2 animate-pulse">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="flex flex-col items-center mb-6">
          <img src={logoImg} alt="MR·SUSHI" className="h-12 w-12 mb-3 rounded-lg shadow-sm" />
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Crear una cuenta nueva</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium"
                placeholder="Elige un nombre de usuario"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-3 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider ml-1">Confirmar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-3 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Código de acceso especial <span className="text-gray-400 normal-case font-medium">(Opcional)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={specialCode}
                onChange={(e) => setSpecialCode(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-400 focus:border-transparent font-medium"
                placeholder="Solo si cuentas con uno"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-gray-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
          >
            {loading ? 'Procesando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Ya tienes una cuenta?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-gray-900 font-bold hover:underline transition-all"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
