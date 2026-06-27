import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import logoImg from '../../assets/logo.png';

export const LoginView: React.FC<{ onSwitchToRegister?: () => void }> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      login(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} alt="MR·SUSHI" className="h-16 w-16 mb-4 rounded-xl shadow-sm" />
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Sistema Inteligente de Inventario</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium transition-colors"
                placeholder="Ingresa tu usuario"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent font-medium transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-red-600/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿No tienes una cuenta?{' '}
              <button 
                onClick={onSwitchToRegister}
                className="text-red-600 font-bold hover:text-red-700 transition-colors"
              >
                Crear cuenta
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
