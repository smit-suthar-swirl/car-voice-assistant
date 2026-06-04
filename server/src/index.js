import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { brandsRouter } from './routes/brands.js'
import { carsRouter } from './routes/cars.js'
import { compareRouter } from './routes/compare.js'
import { showroomsRouter } from './routes/showrooms.js'
import { testDriveRouter } from './routes/testDrive.js'
import { reviewsRouter } from './routes/reviews.js'
import { videosRouter } from './routes/videos.js'
import { geminiSessionRouter } from './routes/geminiSession.js'

const app = new Hono()

app.use('*', logger())
// In dev the Vite client runs on :5173; in production it's served from the
// same origin, so CORS only needs to allow the dev origin.
app.use('/api/*', cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))

app.route('/api/brands', brandsRouter)
app.route('/api/cars', carsRouter)
app.route('/api/compare', compareRouter)
app.route('/api/showrooms', showroomsRouter)
app.route('/api/test-drive', testDriveRouter)
app.route('/api/reviews', reviewsRouter)
app.route('/api/videos', videosRouter)
app.route('/api/gemini-session', geminiSessionRouter)

app.get('/health', (c) => c.json({ ok: true }))

// ── Production: serve the built client from this same service ──────────────
// (Railway runs one web service for both API + static SPA.) serveStatic's
// `root` is resolved relative to the process cwd, which is the server/ dir.
const CLIENT_DIST = '../client/dist'
if (existsSync(resolve(process.cwd(), CLIENT_DIST, 'index.html'))) {
  app.use('/*', serveStatic({ root: CLIENT_DIST }))
  // SPA fallback — any non-API, non-file route returns index.html
  app.get('*', serveStatic({ path: `${CLIENT_DIST}/index.html` }))
  console.log('Serving client build from', CLIENT_DIST)
}

const PORT = parseInt(process.env.PORT ?? '3001')

serve({ fetch: app.fetch, port: PORT }, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  // Pre-embed common review aspects so topic queries respond instantly
  try {
    const { warmupAspectEmbeddings } = await import('./lib/embeddings.js')
    const n = await warmupAspectEmbeddings()
    console.log(`Warmed ${n} aspect embeddings`)
  } catch (e) {
    console.warn('Aspect warmup skipped:', e?.message || e)
  }
})
