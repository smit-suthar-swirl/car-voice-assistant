import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { cached } from '../lib/redis.js'

export const compareRouter = new Hono()

compareRouter.get('/', async (c) => {
  const carIdA = c.req.query('a')
  const carIdB = c.req.query('b')

  if (!carIdA || !carIdB) return c.json({ error: 'Two car IDs required' }, 400)

  // Normalize key order so compare(a,b) === compare(b,a)
  const [id1, id2] = [carIdA, carIdB].sort()
  const cacheKey = `compare:${id1}:${id2}`

  const result = await cached(cacheKey, 600, async () => {
    const [carA, carB] = await Promise.all([
      db.car.findUnique({ where: { id: carIdA }, include: { brand: true } }),
      db.car.findUnique({ where: { id: carIdB }, include: { brand: true } }),
    ])
    return { carA, brandA: carA?.brand, carB, brandB: carB?.brand }
  })

  return c.json(result)
})
