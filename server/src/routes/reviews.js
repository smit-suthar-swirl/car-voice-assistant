import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { embed } from '../lib/embeddings.js'
import { cached } from '../lib/redis.js'

export const reviewsRouter = new Hono()

// Resolve all carIds for the same model (reviews are seeded on one trim only)
async function resolveModelCarIds(carId) {
  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car) return [carId]
  const siblings = await db.car.findMany({
    where: { brandId: car.brandId, slug: car.slug },
    select: { id: true },
  })
  return siblings.map((c) => c.id)
}

reviewsRouter.get('/', async (c) => {
  const carId = c.req.query('carId')
  const query = c.req.query('query')

  if (!carId) return c.json({ error: 'carId required' }, 400)

  const carIds = await resolveModelCarIds(carId)
  const idList = carIds.join(',')

  // Only show reviews this relevant to the query (cosine distance; lower = closer)
  const MAX_DISTANCE = 0.65
  const TOP_N = 4

  if (query) {
    const queryHash = Buffer.from(query).toString('base64').slice(0, 20)
    const cacheKey = `reviews:vec:${idList}:${queryHash}`
    const reviews = await cached(cacheKey, 300, async () => {
      const embedding = await embed(query)
      const vector = `[${embedding.join(',')}]`
      // Rank by semantic distance, keep only genuinely-related ones
      const ranked = await db.$queryRaw`
        SELECT id, "reviewerName", city, text,
               (embedding <=> ${vector}::vector) AS distance
        FROM "Review"
        WHERE "carId" = ANY(${carIds}::text[])
          AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${TOP_N}
      `
      const related = ranked.filter((r) => Number(r.distance) <= MAX_DISTANCE)
      // If nothing is clearly related, fall back to the closest few anyway so
      // the panel is never empty.
      const chosen = related.length ? related : ranked
      return chosen.map(({ distance, ...r }) => r) // drop internal field
    })
    return c.json({ reviews })
  }

  const reviews = await cached(`reviews:latest:${idList}`, 1800, () =>
    db.review.findMany({
      where: { carId: { in: carIds } },
      select: { id: true, reviewerName: true, city: true, text: true },
      take: TOP_N,
    })
  )

  return c.json({ reviews })
})
