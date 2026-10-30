import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `npm run preview` serves the same security headers as production (vercel.json),
// so a CSP violation shows up locally before it reaches users.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const productionHeaders = Object.fromEntries(
  vercel.headers
    .filter((rule) => rule.source === '/(.*)')
    .flatMap((rule) => rule.headers)
    .filter(({ key }) => key !== 'Strict-Transport-Security') // http://localhost
    .map(({ key, value }) => [key, value]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // The lazily loaded Monaco chunk is ~4 MB (~1 MB gzip) by itself
    chunkSizeWarningLimit: 4500,
  },
  preview: {
    headers: productionHeaders,
  },
})
