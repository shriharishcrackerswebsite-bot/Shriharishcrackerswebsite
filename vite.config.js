import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { blogPosts } from './src/data/blogPosts.js'

const HOME_TITLE = 'Shri Harish Crackers Valliyur | Crackers Shop in Valliyur'
const HOME_DESCRIPTION = 'Shri Harish Crackers is a crackers shop in Valliyur, Tirunelveli district, Tamil Nadu, near Rotary Club on Eruvadi Main Road. Enquire for Diwali crackers in Valliyur by phone or WhatsApp.'

function writeRouteHtml(file, { title, description, path, robots = 'index, follow', ogType = 'website' }) {
  const url = path === '/' ? 'https://shriharishcrackers.com/' : `https://shriharishcrackers.com${path}`
  let html = readFileSync(file, 'utf8')
  html = html
    .replaceAll(`content="${HOME_DESCRIPTION}"`, `content="${description}"`)
    .replaceAll(`content="${HOME_TITLE}"`, `content="${title}"`)
    .replace(`<title>${HOME_TITLE}</title>`, `<title>${title}</title>`)
    .replace('content="index, follow"', `content="${robots}"`)
    .replace('href="https://shriharishcrackers.com/"', `href="${url}"`)
    .replace('property="og:url" content="https://shriharishcrackers.com/"', `property="og:url" content="${url}"`)
    .replace('property="og:type" content="website"', `property="og:type" content="${ogType}"`)
  writeFileSync(file, html)
}

function clientRouteEntries() {
  return {
    name: 'client-route-entries',
    apply: 'build',
    closeBundle() {
      const dist = resolve('dist')
      const index = resolve(dist, 'index.html')

      const routes = [
        {
          folder: 'admin',
          title: 'Admin – Shri Harish Crackers',
          description: 'Private catalog administration for Shri Harish Crackers.',
          path: '/admin',
          robots: 'noindex, nofollow',
        },
        {
          folder: 'product-list',
          title: 'Product List | Shri Harish Crackers Valliyur',
          description: 'Browse the Shri Harish Crackers product list in Valliyur, compare Diwali crackers and fireworks, choose quantities, and send an enquiry by phone or WhatsApp.',
          path: '/product-list',
        },
        {
          folder: 'blog',
          title: 'Crackers Guides for Valliyur | Shri Harish Crackers',
          description: 'Read practical guides on choosing Diwali crackers, planning your shopping, and handling fireworks safely from Shri Harish Crackers in Valliyur.',
          path: '/blog',
        },
        ...blogPosts.map(post => ({
          folder: `blog/${post.slug}`,
          title: post.metaTitle,
          description: post.metaDescription,
          path: `/blog/${post.slug}`,
          ogType: 'article',
        })),
      ]

      for (const route of routes) {
        const directory = resolve(dist, route.folder)
        mkdirSync(directory, { recursive: true })
        const file = resolve(directory, 'index.html')
        copyFileSync(index, file)
        writeRouteHtml(file, route)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clientRouteEntries()],
})
