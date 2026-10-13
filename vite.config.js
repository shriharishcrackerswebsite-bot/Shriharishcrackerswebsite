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
        if (route === 'admin') {
          const html = readFileSync(file, 'utf8')
            .replace('content="index, follow"', 'content="noindex, nofollow"')
            .replace('<title>Shri Harish Crackers Valliyur | Crackers Shop in Valliyur</title>', '<title>Admin – Shri Harish Crackers</title>')
            .replace('href="https://shriharishcrackers.com/"', 'href="https://shriharishcrackers.com/admin"')
            .replace('property="og:url" content="https://shriharishcrackers.com/"', 'property="og:url" content="https://shriharishcrackers.com/admin"')
          writeFileSync(file, html)
        }
        if (route === 'product-list') {
          const description = 'Browse the Shri Harish Crackers product list in Valliyur, choose quantities, and send an enquiry for Diwali crackers and fireworks.'
          const homeDescription = 'Shri Harish Crackers is a crackers shop in Valliyur, Tamil Nadu, on Eruvadi Main Road near Rotary Club. Enquire about Diwali crackers and fireworks in Valliyur, also known as Valiyoor, by phone or WhatsApp.'
          const html = readFileSync(file, 'utf8')
            .replace('<title>Shri Harish Crackers Valliyur | Crackers Shop in Valliyur</title>', '<title>Product List | Shri Harish Crackers, Valliyur</title>')
            .replaceAll(`content="${homeDescription}"`, `content="${description}"`)
            .replaceAll('content="Shri Harish Crackers Valliyur | Crackers Shop in Valliyur"', 'content="Product List | Shri Harish Crackers, Valliyur"')
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
