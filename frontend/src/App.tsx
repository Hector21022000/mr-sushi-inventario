/**
 * Qué hace el archivo: Componente principal de la aplicación. Gestiona la navegación (Dashboard, Inventario, Historial, Reportes), la cabecera, la edición del responsable de turno y la apertura del panel de compras críticas.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import React, { useState } from 'react';
import { useInventory } from './context/InventoryContext';
import { DashboardView } from './components/Dashboard/DashboardView';
import { InventoryTablesView } from './components/Inventory/InventoryTablesView';
import { RequiredItemsView } from './components/Inventory/RequiredItemsView';
import { AuditHistoryView } from './components/History/AuditHistoryView';
import { CriticalSidebarPanel } from './components/Sidebar/CriticalSidebarPanel';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  History, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  AlertTriangle
} from 'lucide-react';
import logoImg from './assets/logo.png';

const App: React.FC = () => {
  const { responsable, setResponsable, criticalItems, error } = useInventory();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [criticalPanelOpen, setCriticalPanelOpen] = useState<boolean>(false);
  const [respInput, setRespInput] = useState<string>(responsable);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario General', icon: FileSpreadsheet },
    { id: 'required_items', label: 'Lista de Compras', icon: ShoppingCart },
    { id: 'history', label: 'Historial / Auditoría', icon: History }
  ];

  const handleRespBlur = () => {
    const trimmed = respInput.trim();
    if (trimmed) {
      setResponsable(trimmed);
    } else {
      setRespInput(responsable);
    }
  };

  const handleRespKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans antialiased text-gray-800">
      
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="MR·SUSHI Logo" className="h-10 w-10 object-contain rounded-lg" />
            <div>
              <h1 className="font-extrabold text-gray-900 tracking-tight text-base">MR·SUSHI</h1>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Inventario Inteligente</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Responsable */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Responsable Activo</span>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={respInput}
                onChange={(e) => setRespInput(e.target.value)}
                onBlur={handleRespBlur}
                onKeyDown={handleRespKeyDown}
                className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none w-full border-b border-transparent hover:border-gray-200 focus:border-red-500 transition-colors"
                placeholder="Nombre del responsable"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center font-medium">© {new Date().getFullYear()} MR·SUSHI S.A.C.</p>
        </div>
      </aside>

      {/* SIDEBAR MÓVIL (MENU HAMBURGUESA SLIDEOVER) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Fondo obscuro */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          
          {/* Contenedor del menú */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white p-6 justify-between h-full shadow-2xl">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-8 mt-4">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="MR·SUSHI Logo" className="h-9 w-9 object-contain" />
                <div>
                  <h1 className="font-extrabold text-gray-900 tracking-tight text-sm">MR·SUSHI</h1>
                  <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider">Inventario</p>
                </div>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        activeTab === item.id
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Responsable</span>
                <input
                  type="text"
                  value={respInput}
                  onChange={(e) => setRespInput(e.target.value)}
                  onBlur={handleRespBlur}
                  onKeyDown={handleRespKeyDown}
                  className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none w-full border-b border-transparent focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* CABECERA (HEADER) */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 hidden md:block">
              {activeTab === 'dashboard' && 'Dashboard General'}
              {activeTab === 'inventory' && 'Inventario General'}
              {activeTab === 'required_items' && 'Productos Requeridos (Compras)'}
              {activeTab === 'history' && 'Auditoría de Cambios'}
            </h2>
            {/* Logo en Móviles en la Cabecera */}
            <div className="flex lg:hidden items-center gap-2">
              <img src={logoImg} alt="MR·SUSHI" className="h-8 object-contain" />
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">MR·SUSHI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Responsable Rápido en Cabecera (Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 font-medium">Turno de:</span>
              <strong className="text-gray-800">{responsable}</strong>
            </div>

            {/* Carrito / Compras Críticas Badge */}
            <button
              onClick={() => setCriticalPanelOpen(true)}
              className="relative p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center"
              title="Ver compras pendientes"
            >
              <ShoppingCart className="w-5 h-5" />
              {criticalItems.length > 0 && (
                <>
                  {/* Círculo animado */}
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-[10px] font-extrabold text-white items-center justify-center">
                      {criticalItems.length}
                    </span>
                  </span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* CONTENIDO DENTRO DE VISTAS */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* Banner de alerta de error del backend */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vistas Renderizadas por Tab */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'inventory' && <InventoryTablesView />}
          {activeTab === 'required_items' && <RequiredItemsView />}
          {activeTab === 'history' && <AuditHistoryView />}
        </main>
      </div>

      {/* PANEL LATERAL DE COMPRAS (COMPONENTE SLIDE-OVER) */}
      <CriticalSidebarPanel 
        isOpen={criticalPanelOpen} 
        onClose={() => setCriticalPanelOpen(false)} 
      />
    </div>
  );
};

export default App;
