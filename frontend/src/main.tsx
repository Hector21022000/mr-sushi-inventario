/**
 * Qué hace el archivo: Punto de entrada del cliente React. Renderiza la aplicación envuelta por el InventoryProvider de estado global.
 * Fecha de última modificación: 2026-06-26
 * Nombre del autor: Antigravity
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { InventoryProvider } from './context/InventoryContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <InventoryProvider>
          <App />
        </InventoryProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)

