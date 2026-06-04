import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { embed } from '../lib/embeddings.js'
import { cached } from '../lib/redis.js'

export const videosRouter = new Hono()

async function resolveModelCarIds(carId) {
  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car) return [carId]
  const siblings = await db.car.findMany({
    where: { brandId: car.brandId, slug: car.slug },
    select: { id: true },
  })
  return siblings.map((c) => c.id)
}

videosRouter.get('/', async (c) => {
  const carId = c.req.query('carId')
  const query = c.req.query('query')

  if (!carId) return c.json({ error: 'carId required' }, 400)

  const carIds = await resolveModelCarIds(carId)
  const idList = carIds.join(',')

  if (query) {
    const queryHash = Buffer.from(query).toString('base64').slice(0, 20)
    const cacheKey = `videos:vec:${idList}:${queryHash}`
    const videos = await cached(cacheKey, 300, async () => {
      const embedding = await embed(query)
      const vector = `[${embedding.join(',')}]`
      return db.$queryRaw`
        SELECT id, title, "youtubeId", "thumbnailUrl", tags, summary
        FROM "VideoReview"
        WHERE "carId" = ANY(${carIds}::text[])
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vector}::vector
        LIMIT 4
      `
    })
    return c.json({ videos })
  }

  const videos = await cached(`videos:latest:${idList}`, 1800, () =>
    db.videoReview.findMany({
      where: { carId: { in: carIds } },
      select: { id: true, title: true, youtubeId: true, thumbnailUrl: true, tags: true, summary: true },
      take: 4,
    })
  )

  return c.json({ videos })
})
