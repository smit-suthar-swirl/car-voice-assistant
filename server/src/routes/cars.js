import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { cached } from '../lib/redis.js'

export const carsRouter = new Hono()

carsRouter.get('/', async (c) => {
  const brandSlug = c.req.query('brand')
  const modelSlug = c.req.query('model')
  const trim = c.req.query('trim')

  const cacheKey = `cars:${brandSlug ?? 'all'}:${modelSlug ?? 'all'}:${trim ?? 'all'}`

  const cars = await cached(cacheKey, 1800, async () => {
    const where = {}
    if (brandSlug) where.brand = { slug: { equals: brandSlug, mode: 'insensitive' } }
    if (modelSlug) where.slug = { equals: modelSlug, mode: 'insensitive' }
    if (trim) where.trim = { equals: trim, mode: 'insensitive' }

    return db.car.findMany({
      where,
      include: { brand: true },
      orderBy: [{ model: 'asc' }, { trim: 'asc' }],
    })
  })

  // brand context for the first result
  const brand = cars[0]?.brand ?? null

  return c.json({ cars, brand })
})

carsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const car = await cached(`car:id:${id}`, 1800, () =>
    db.car.findUnique({ where: { id }, include: { brand: true } })
  )
  if (!car) return c.json({ error: 'Not found' }, 404)
  return c.json({ car })
})
