import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { cached } from '../lib/redis.js'

export const brandsRouter = new Hono()

brandsRouter.get('/', async (c) => {
  const brands = await cached('brands:all', 3600, () =>
    db.brand.findMany({ orderBy: { name: 'asc' } })
  )
  return c.json({ brands })
})
