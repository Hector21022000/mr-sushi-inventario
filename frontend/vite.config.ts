/**
 * Nombre del archivo: vite.config.ts
 * Qué hace el archivo: Configuración de Vite con React, Tailwind CSS v4 y alias de rutas para shadcn/ui.
 * Fecha de última modificación: 2026-06-26
 * Autor: Antigravity AI
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

