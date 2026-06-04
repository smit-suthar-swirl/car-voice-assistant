import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { redisClient } from '../lib/redis.js'

export const testDriveRouter = new Hono()

testDriveRouter.post('/', async (c) => {
  const body = await c.req.json()
  const { name, mobile, showroomId, carId, slot } = body

  if (!name || !mobile || !showroomId || !carId || !slot) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const slotDate = new Date(slot)

  const [booking] = await db.$transaction([
    db.testDrive.create({
      data: { name, mobile, showroomId, carId, slot: slotDate, status: 'confirmed' },
    }),
    db.timeSlot.updateMany({
      where: { showroomId, slot: slotDate },
      data: { isBooked: true },
    }),
  ])

  // Invalidate slot cache for this showroom
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await redisClient.del(`slots:${showroomId}:${today.toDateString()}`)

  return c.json(booking, 201)
})
