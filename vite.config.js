import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
        const file = resolve(directory, 'index.html')
        copyFileSync(index, file)
        if (route === 'product-list') {
          const description = 'Browse the Shri Harish Crackers product list in Valliyur, choose quantities, and send an enquiry for Diwali and festival crackers.'
          const html = readFileSync(file, 'utf8')
            .replace('<title>Shri Harish Crackers | Diwali Crackers in Valliyur</title>', '<title>Product List | Shri Harish Crackers, Valliyur</title>')
            .replaceAll('content="Shri Harish Crackers in Valliyur, Tamil Nadu, offers Diwali and festival crackers for family celebrations. Send an enquiry and the shop confirms by WhatsApp or phone."', `content="${description}"`)
            .replace('href="https://shriharishcrackers.com/"', 'href="https://shriharishcrackers.com/product-list"')
            .replace('property="og:url" content="https://shriharishcrackers.com/"', 'property="og:url" content="https://shriharishcrackers.com/product-list"')
          writeFileSync(file, html)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), clientRouteEntries()],
})
