/**
 * Qué hace el archivo: Pantalla de Bienvenida (Login) para ingresar el nombre del encargado y seleccionar el turno de trabajo.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import logoImg from '../../assets/logo.png';
import { User, Sun, Sunset, Moon, LogIn } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginUser, error: contextError } = useInventory();
  const [encargado, setEncargado] = useState<string>(() => {
    return localStorage.getItem('mr_sushi_responsable') || '';
  });
  const [selectedTurno, setSelectedTurno] = useState<string>(() => {
    return localStorage.getItem('mr_sushi_turno') || '';
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!encargado.trim()) {
      setLocalError('Por favor, ingresa el nombre del encargado.');
      return;
    }
    if (!selectedTurno) {
      setLocalError('Por favor, selecciona un turno de trabajo.');
      return;
    }

    try {
      setSubmitting(true);
      await loginUser(encargado.trim(), selectedTurno);
    } catch (err) {
      setLocalError('No se pudo establecer conexión para iniciar sesión. Inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const turnos = [
    { id: 'Mañana', icon: Sun, label: 'Mañana', color: 'hover:border-amber-500 hover:bg-amber-50/50 text-amber-600 border-gray-200' },
    { id: 'Tarde', icon: Sunset, label: 'Tarde', color: 'hover:border-orange-500 hover:bg-orange-50/50 text-orange-600 border-gray-200' },
    { id: 'Noche', icon: Moon, label: 'Noche', color: 'hover:border-indigo-500 hover:bg-indigo-50/50 text-indigo-600 border-gray-200' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-50 p-4 rounded-3xl mb-4 shadow-sm border border-red-100/50">
            <img src={logoImg} alt="MR·SUSHI" className="h-16 w-16 object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Control de Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">Bienvenido. Ingrese sus datos para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Encargado */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Encargado del Inventario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={encargado}
                onChange={(e) => setEncargado(e.target.value)}
                placeholder="Nombre completo..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-red-500 focus:outline-none transition-all font-medium text-gray-800"
              />
            </div>
          </div>

          {/* Selector de Turno */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Seleccionar Turno</label>
            <div className="grid grid-cols-3 gap-3">
              {turnos.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTurno === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTurno(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-600 font-bold scale-[1.02] shadow-sm'
                        : `bg-white ${t.color} text-gray-600 font-medium`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alertas de error */}
          {(localError || contextError) && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium text-center">
              {localError || contextError}
            </div>
          )}

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:shadow-none hover:shadow-red-300 transition-all text-sm uppercase tracking-wider"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};
