/**
 * Qué hace el archivo: Componente de Dashboard que muestra tarjetas de KPI de inventario, gráfico de barras de productos con menor stock y gráfico circular de distribución de stock.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Boxes,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  TrendingDown
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { stats, inventory } = useInventory();

  // Preparar datos para el gráfico circular de distribución de estados
  const pieData = [
    { name: 'Suficiente (>= 10)', value: stats.suficiente, color: '#10B981' }, // Verde
    { name: 'Medio (5 - 9)', value: stats.medio, color: '#FBBF24' },        // Amarillo
    { name: 'Bajo (3 - 4)', value: stats.bajo, color: '#F97316' },          // Naranja
    { name: 'Crítico (1 - 2)', value: stats.critico, color: '#EF4444' },    // Rojo
    { name: 'Sin Stock (0)', value: stats.sinStock, color: '#7F1D1D' }       // Rojo oscuro / Negro
  ].filter(item => item.value > 0); // Solo mostrar los que tengan cantidad > 0

  // Obtener los 10 productos con menor stock (excluyendo categorías de cajas que pueden ser diferentes en escalas)
  const lowestStockData = [...inventory]
    .filter(item => item.category !== 'cajas_1' && item.category !== 'cajas_2')
    .sort((a, b) => a.total - b.total)
    .slice(0, 8)
    .map(item => ({
      name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
      'Stock Total': item.total,
      category: item.category
    }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Tarjetas de Indicadores (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Productos */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Total Productos</span>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Boxes className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalProducts}</h3>
            <p className="text-xs text-gray-400 mt-1">Registrados en Excel</p>
          </div>
        </motion.div>

        {/* Stock Suficiente */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Suficiente (≥10)</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-emerald-600">{stats.suficiente}</h3>
            <p className="text-xs text-gray-400 mt-1">Abastecimiento óptimo</p>
          </div>
        </motion.div>

        {/* Stock Medio */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Medio (5-9)</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-amber-500">{stats.medio}</h3>
            <p className="text-xs text-gray-400 mt-1">Niveles normales</p>
          </div>
        </motion.div>

        {/* Stock Bajo */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Bajo (3-4)</span>
            <div className="p-2 bg-orange-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-orange-500">{stats.bajo}</h3>
            <p className="text-xs text-gray-400 mt-1">Reposición sugerida</p>
          </div>
        </motion.div>

        {/* Crítico */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
        >
          {stats.critico > 0 && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl animate-pulse" />
          )}
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Crítico (1-2)</span>
            <div className="p-2 bg-red-50 rounded-xl">
              <Flame className="w-5 h-5 text-red-600 animate-bounce" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-red-600">{stats.critico}</h3>
            <p className="text-xs text-gray-400 mt-1">Comprar urgente</p>
          </div>
        </motion.div>

        {/* Sin Stock */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
        >
          {stats.sinStock > 0 && (
            <div className="absolute inset-0 border-2 border-red-500/20 rounded-2xl animate-pulse" />
          )}
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Sin Stock (0)</span>
            <div className="p-2 bg-red-950/10 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-900" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-red-900">{stats.sinStock}</h3>
            <p className="text-xs text-gray-400 mt-1">Agotados de inmediato</p>
          </div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Productos Críticos / Menor Stock */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Productos con Menor Stock</h4>
              <p className="text-xs text-gray-500">Ingredientes, bebidas y utensilios con menor inventario disponible</p>
            </div>
          </div>
          <div className="h-80 w-full">
            {lowestStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lowestStockData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F3F4F6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="Stock Total" radius={[4, 4, 0, 0]}>
                    {lowestStockData.map((entry, index) => {
                      // Color condicional en base al valor del stock
                      const val = entry['Stock Total'];
                      const color = val === 0 ? '#7F1D1D' : val <= 2 ? '#EF4444' : val <= 4 ? '#F97316' : '#FBBF24';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No hay suficientes datos de stock.
              </div>
            )}
          </div>
        </motion.div>

        {/* Gráfico Circular - Distribución de Estados */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h4 className="text-lg font-bold text-gray-900">Distribución de Inventario</h4>
            <p className="text-xs text-gray-500">Porcentaje de productos según su estado de stock</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Productos`, 'Cantidad']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F3F4F6',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">Cargando distribución...</div>
            )}
            {/* Texto en el centro del donut */}
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-gray-900">{stats.totalProducts}</span>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Productos</p>
            </div>
          </div>
          {/* Leyenda de colores personalizada */}
          <div className="space-y-1.5 mt-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 font-medium">{entry.name}</span>
                </div>
                <span className="text-gray-900 font-semibold">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
