/**
 * Qué hace el archivo: Componente que muestra la fecha y hora del dispositivo en tiempo real.
 * Fecha de última modificación: 2026-06-27
 * Nombre del autor: Antigravity
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export const RealTimeClockPanel: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (n: number) => String(n).padStart(2, '0');

  const formattedDate = `${formatDigits(time.getDate())}/${formatDigits(time.getMonth() + 1)}/${time.getFullYear()}`;
  const formattedTime = `${formatDigits(time.getHours())}:${formatDigits(time.getMinutes())}:${formatDigits(time.getSeconds())}`;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/60 hover:bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-gray-700 shadow-sm transition-all hover:scale-[1.02]">
      <span className="flex items-center gap-1 text-red-600">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formattedDate}</span>
      </span>
      <span className="w-px h-3 bg-red-200" />
      <span className="flex items-center gap-1 text-gray-600 font-mono">
        <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        <span>{formattedTime}</span>
      </span>
    </div>
  );
};
