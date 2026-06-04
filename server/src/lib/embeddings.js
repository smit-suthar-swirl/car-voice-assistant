import { GoogleGenAI } from '@google/genai'
import { cacheGet, cacheSet } from './redis.js'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// 1536 dims (down from 3072): still high-quality, half the storage, and — crucially —
// under pgvector's 2000-dim index limit so HNSW indexing works for fast search at scale.
export const EMBED_DIM = 1536

// Common question aspects — pre-warmed at startup so the typical query needs
// no runtime embedding call at all.
const COMMON_ASPECTS = [
  'speed', 'performance', 'acceleration', 'comfort', 'fuel economy', 'mileage',
  'reliability', 'interior', 'safety', 'value for money', 'space', 'handling',
  'features', 'design', 'technology',
]

const normalize = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ')
// Cache key includes the dim — bumping EMBED_DIM auto-invalidates stale vectors.
const cacheKey = (t) => `emb:q:${EMBED_DIM}:${normalize(t)}`

async function embedRaw(text) {
  const result = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [text],
    config: { outputDimensionality: EMBED_DIM },
  })
  return result.embeddings[0].values
}

/**
 * Embed text with a Redis cache keyed by the normalized text. The same query
 * ("speed") embeds once, then every car/user reuses it instantly.
 */
const TTL = 60 * 60 * 24 // 24h

export async function embed(text) {
  const key = cacheKey(text)
  const hit = await cacheGet(key)
  if (hit) return hit
  const vec = await embedRaw(text)
  await cacheSet(key, vec, TTL)
  return vec
}

/** Pre-embed common aspects on boot so frequent questions are instant. */
export async function warmupAspectEmbeddings() {
  let warmed = 0
  await Promise.all(
    COMMON_ASPECTS.map(async (a) => {
      const key = cacheKey(a)
      if (await cacheGet(key)) return
      try {
        await cacheSet(key, await embedRaw(a), TTL)
        warmed++
      } catch (_) { /* non-fatal */ }
    })
  )
  return warmed
}

/** Haversine distance in km */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
