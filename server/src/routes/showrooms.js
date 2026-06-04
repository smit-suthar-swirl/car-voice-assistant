import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { cached } from '../lib/redis.js'
import { haversineKm } from '../lib/embeddings.js'

export const showroomsRouter = new Hono()

showroomsRouter.get('/', async (c) => {
  const brandSlug = c.req.query('brand')
  const lat = parseFloat(c.req.query('lat'))
  const lng = parseFloat(c.req.query('lng'))

  const showrooms = await db.showroom.findMany({
    where: brandSlug
      ? { brands: { some: { brand: { slug: brandSlug } } } }
      : undefined,
    include: { brands: { include: { brand: true } } },
  })

  const withDistance = showrooms.map((s) => ({
    ...s,
    distanceKm: !isNaN(lat) && !isNaN(lng)
      ? Math.round(haversineKm(lat, lng, s.lat, s.lng) * 10) / 10
      : null,
  }))

  withDistance.sort((a, b) =>
    a.distanceKm !== null && b.distanceKm !== null
      ? a.distanceKm - b.distanceKm
      : 0
  )

  return c.json({ showrooms: withDistance })
})

// Curated booking windows — keep the choice small and clear for voice + UI
const SLOT_HOURS = [10, 13, 16] // morning, afternoon, evening
const SLOT_DAYS = 3

showroomsRouter.get('/:id/slots', async (c) => {
  const showroomId = c.req.param('id')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const until = new Date(today)
  until.setDate(until.getDate() + SLOT_DAYS)

  const cacheKey = `slots:${showroomId}:${today.toDateString()}`
  const all = await cached(cacheKey, 120, () =>
    db.timeSlot.findMany({
      where: { showroomId, slot: { gte: new Date(), lte: until } },
      orderBy: { slot: 'asc' },
    })
  )

  // Keep only the curated hours, max one per (day, hour) → ~9 clean options
  const slots = all.filter((s) => SLOT_HOURS.includes(new Date(s.slot).getHours()))

  return c.json({ slots })
})
