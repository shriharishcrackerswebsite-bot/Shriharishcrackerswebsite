import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const clientRoutes = ['admin', 'product-list']

function clientRouteEntries() {
  return {
    name: 'client-route-entries',
    apply: 'build',
    closeBundle() {
      const dist = resolve('dist')
      const index = resolve(dist, 'index.html')
      for (const route of clientRoutes) {
        const directory = resolve(dist, route)
        mkdirSync(directory, { recursive: true })
        copyFileSync(index, resolve(directory, 'index.html'))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), clientRouteEntries()],
})
