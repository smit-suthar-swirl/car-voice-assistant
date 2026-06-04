// Cache layer with a graceful in-memory fallback. If REDIS_URL is set we use
// Redis; otherwise an in-process Map (with TTL) so the app runs with ZERO
// external cache dependency — perfect for simple/free single-service hosting.
import Redis from 'ioredis'

let redis = null
const mem = new Map() // key -> { value, expiresAt }

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 })
  redis.on('error', () => {}) // never crash on cache errors
}

function memGet(key) {
  const e = mem.get(key)
  if (!e) return null
  if (e.expiresAt && e.expiresAt < Date.now()) { mem.delete(key); return null }
  return e.value
}
function memSet(key, value, ttlSeconds) {
  mem.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 })
}

export const usingRedis = Boolean(redis)

export async function cacheGet(key) {
  if (redis) { try { const v = await redis.get(key); return v == null ? null : JSON.parse(v) } catch { return null } }
  return memGet(key)
}

export async function cacheSet(key, value, ttlSeconds) {
  if (redis) { try { await redis.setex(key, ttlSeconds, JSON.stringify(value)) } catch {} return }
  memSet(key, value, ttlSeconds)
}

export async function cached(key, ttlSeconds, fetcher) {
  const hit = await cacheGet(key)
  if (hit !== null && hit !== undefined) return hit
  const value = await fetcher()
  const isEmpty = value == null || (Array.isArray(value) && value.length === 0)
  if (!isEmpty) await cacheSet(key, value, ttlSeconds)
  return value
}

/** Fixed-window rate limiter. Fails OPEN on any error. */
export async function rateLimit(key, limit, windowSeconds) {
  if (redis) {
    try {
      const n = await redis.incr(key)
      if (n === 1) await redis.expire(key, windowSeconds)
      return n <= limit
    } catch { return true }
  }
  // in-memory counter
  const e = mem.get(key)
  const now = Date.now()
  if (!e || (e.expiresAt && e.expiresAt < now)) { memSet(key, 1, windowSeconds); return true }
  e.value = (e.value || 0) + 1
  return e.value <= limit
}

// Back-compat: some modules import `redis` directly for raw ops (del). Provide a
// thin shim that no-ops when Redis isn't configured.
export const redisClient = {
  async del(key) { if (redis) { try { await redis.del(key) } catch {} } else mem.delete(key) },
}
