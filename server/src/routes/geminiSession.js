import { Hono } from 'hono'
import { GoogleGenAI } from '@google/genai'
import { db } from '../lib/db.js'
import { ASSISTANT_TOOLS, buildSystemPrompt } from '../lib/tools.js'
import { rateLimit } from '../lib/redis.js'

export const geminiSessionRouter = new Hono()

// gemini-3.1-flash-live → much lower latency than native-audio models. The
// client parses the audio sample rate dynamically, so output plays cleanly.
// Configurable via env so the model can be swapped without a code change.
const MODEL = process.env.GEMINI_LIVE_MODEL || 'models/gemini-3.1-flash-live-preview'

// Real API key lives only here, on the server.
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

geminiSessionRouter.get('/', async (c) => {
  const brandSlug = c.req.query('brand')
  const modelSlug = c.req.query('model')

  if (!brandSlug || !modelSlug) {
    return c.json({ error: 'brand and model required' }, 400)
  }

  // Rate-limit token minting per client so a leaked endpoint can't be abused
  // to burn Gemini quota. 10 new sessions / minute / IP.
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip') || 'local'
  if (!(await rateLimit(`rl:session:${ip}`, 10, 60))) {
    return c.json({ error: 'Too many requests. Please wait a moment.' }, 429)
  }

  const car = await db.car.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug } },
    include: { brand: true },
  })
  if (!car) return c.json({ error: 'Car not found' }, 404)

  const liveConfig = {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } },
    realtimeInputConfig: {
      automaticActivityDetection: {
        startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
        endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
        prefixPaddingMs: 50,
        silenceDurationMs: 100,
      },
    },
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: {},
    systemInstruction: { parts: [{ text: buildSystemPrompt(car.brand, car) }] },
    tools: [{ functionDeclarations: ASSISTANT_TOOLS }],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  }

  // Mint a short-lived, single-use ephemeral token. The real API key never
  // reaches the browser — the client connects to Gemini Live directly with
  // this token (preserving low latency, no audio proxying).
  const now = Date.now()
  let token
  try {
    token = await genai.authTokens.create({
      config: {
        uses: 1, // one session start; a fresh token is minted per (re)connect
        expireTime: new Date(now + 2 * 60 * 1000).toISOString(),        // connect within 2 min
        newSessionExpireTime: new Date(now + 30 * 60 * 1000).toISOString(), // session lives up to 30 min
        httpOptions: { apiVersion: 'v1alpha' },
      },
    })
  } catch (e) {
    console.error('authTokens.create failed:', e?.message || e)
    return c.json({ error: 'Could not create session token' }, 502)
  }

  return c.json({
    token: token.name,
    sessionConfig: { model: MODEL, config: liveConfig },
    carId: car.id,
  })
})
