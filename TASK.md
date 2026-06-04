# AI Voice Sales Agent — Honda Civic (multi-brand ready)

A production-quality, **voice-first car sales assistant** built on the **Gemini
Live API**. The user taps a mic, talks naturally, and the agent answers about
the car, compares it with competitors, shows images/videos/reviews, and books a
test drive end-to-end — driven entirely by voice (with click fallbacks), while
the screen updates live as the agent speaks.

- **Live demo:** https://car-voice-assistant.onrender.com/
- **Repo:** https://github.com/smit-suthar-swirl/car-voice-assistant

---

## In plain words (non-technical)

Imagine walking into a showroom and a friendly salesperson greets you — except
this one lives on a screen and you talk to it like a real person.

- You **tap the microphone and just speak**: "Tell me about the Honda Civic."
- It **answers out loud** in a natural voice, and at the same time the screen
  shows what it's talking about — the car's photo, price, and features.
- Ask "**show me the inside**" or "**the front**" and the matching photo appears.
- Ask "**how does it compare to the Toyota Corolla?**" and you get a clean
  side-by-side comparison.
- Ask "**what do people say about the speed?**" and it pulls up the most
  relevant real customer reviews — not random ones, the ones actually about
  speed.
- Say "**I'd like a test drive**" and it books it for you by voice: it asks your
  name and number, shows the nearest showrooms, lets you pick a time, confirms,
  and saves the booking.
- You can **interrupt it** anytime by just talking — it stops and listens, like
  a real conversation.
- Works on your **phone or computer**, and you can **mute** the mic whenever.

In short: it's a hands-free, talk-to-it car salesperson that shows you exactly
what it's describing as it speaks, and can complete a real booking — all by voice.

---

## 1. What it does (functionality)

| Capability | How it works |
|---|---|
| **Natural voice conversation** | Real-time, bidirectional audio via Gemini Live API. Tap mic → speak → agent replies in a natural voice (Sulafat). |
| **Live "show, don't tell" UI** | The agent calls tools that push structured data to the screen — spec cards, comparisons, videos, reviews, booking panels appear *as it talks*. |
| **Car info & specs** | Honda Civic across trims (LX, Sport, EX-L, Touring, Si). Agent quotes exact specs returned by the tool (never hallucinated numbers). |
| **View-specific images** | "Show the front / side / rear / interior" → renders that exact angle (imagin.studio for exteriors, curated Wikimedia interiors). |
| **Cross-brand comparison** | "Compare with the Corolla" → side-by-side spec cards for any two cars in the DB. |
| **Semantic review search** | "What do people say about the speed?" → pgvector ranks reviews by meaning and shows the top 4 relevant ones. |
| **YouTube video reviews** | Topic-relevant review videos via the same vector search. |
| **Voice test-drive booking** | Agent collects name + mobile by voice → shows nearby showrooms (GPS-sorted) → time slots → confirmation → writes the booking to the DB. |
| **Barge-in** | Speak while the agent talks and it stops to listen (level-gated so its own voice doesn't self-interrupt). |
| **Mobile responsive + mute** | Works on phones; mute toggle; animated mic + waveform + connecting loader. |

---

## 2. System architecture

```
                          Browser (Vite + React SPA)
                          ─────────────────────────────
   ┌── tap mic ───────────────────────────────────────────────┐
   │                                                           │
   │   useGeminiLive hook                                      │
   │   • AudioWorklet mic capture (16 kHz, batched 32 ms)      │
   │   • plays 24 kHz response audio                           │
   │   • client-side level metering (waveform + barge-in)      │
   │                                                           │
   │        ① GET /api/gemini-session  (ephemeral token)       │
   │        ───────────────────────────────────────────►  Node/Hono server
   │                                                       (Render web service)
   │        ② direct WebSocket  (low latency, no proxy)        │
   │        ◄═══════════════════════════════════════►  Gemini Live API
   │           audio in / audio out / tool calls               │
   │                                                           │
   │        ③ tool call → fetch /api/...  ◄────────────►  Node/Hono server
   │           (car / compare / reviews / videos /             │
   │            showrooms / slots / test-drive)                │
   └───────────────────────────────────────────────────────────┘

   Node/Hono server (single Render service)
   ────────────────────────────────────────
   • Mints short-lived Gemini ephemeral tokens (real key stays server-side)
   • REST API for cars, comparison, reviews, videos, showrooms, booking
   • Serves the built React client (static + SPA fallback)
   • Rate-limits token minting
        │                              │
        ▼                              ▼
   PostgreSQL + pgvector          In-memory cache
   (Render free Postgres)         (Redis-optional fallback)
   • cars / brands / showrooms    • car/comparison/showroom results
   • reviews + 1536-dim vectors   • query-embedding cache
   • videos + vectors (HNSW)      • rate-limit counters
   • test drives / time slots

   External services
   ─────────────────
   • Gemini Live API        — voice conversation + function calling
   • Gemini text-embedding  — review/video embeddings (1536-dim)
   • imagin.studio          — model-accurate car images by make/model/angle
   • Wikimedia Commons      — curated interior photos
```

### Why the browser connects to Gemini directly
Audio is **not proxied** through our server — the browser opens the Live
WebSocket itself using a **short-lived ephemeral token** minted server-side.
This keeps latency minimal *and* the real API key never reaches the client.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Client | Vite + React (JS), Tailwind v4, Framer Motion, Zustand |
| Voice | Gemini Live API (`gemini-3.1-flash-live-preview`), AudioWorklet, Web Audio |
| Server | Node 20, Hono, `@hono/node-server` (serves API + static client) |
| DB | PostgreSQL + **pgvector** (HNSW cosine indexes), Prisma ORM |
| Cache | Redis (optional) → in-memory fallback |
| Embeddings | `gemini-embedding-001` @ 1536 dims |
| Images | imagin.studio (exteriors) + Wikimedia (interiors) |
| Hosting | Render (free web service + free Postgres) |

---

## 4. Gemini tool calls (function calling)

The agent drives the UI by calling these tools; results stream back so it keeps
talking while the screen updates:

- `show_car_info(trim?, view?)` — spec card or a specific image angle
- `show_comparison(competitorBrand, competitorModel)` — side-by-side cards
- `show_reviews(query?)` — top-4 semantically-ranked reviews
- `show_videos(query?)` — relevant review videos
- `show_nearby_showrooms(lat, lng, name, mobile)` — GPS-sorted showrooms
- `show_time_slots(showroomId)` — available slots
- `confirm_booking(...)` / `book_test_drive(...)` — review then persist

---

## 5. Data model (Prisma)

`Brand → Car (trims) → Review / VideoReview` (each with a `vector(1536)`
embedding), plus `Showroom ↔ ShowroomBrand`, `TimeSlot`, and `TestDrive`.
Designed multi-brand from day one: adding a brand/model is data, not code.

---

## 6. Performance & scalability

- **Latency:** ephemeral-token prefetch on page load, 120 ms VAD endpointing,
  32 ms input batching, 20 ms output lookahead, instant (non-blocking) tool
  replies for display cards.
- **Reliability:** session resumption + auto-reconnect for long conversations,
  generation-guarded callbacks, graceful teardown, never-stuck watchdogs.
- **Scales flat with data:** per-car-scoped + HNSW-indexed vector search, FK
  indexes, result + embedding caching, CDN-rendered images, stateless server.

---

## 7. Run locally

```bash
# server/.env needs: DATABASE_URL, GEMINI_API_KEY  (REDIS_URL optional)
npm install --prefix client && npm install --prefix server
npm run seed          # schema + cars/reviews/videos with embeddings
npm run dev           # client :5173  +  server :3001
```

## 8. Deploy (Render — free)
One-click via `render.yaml` blueprint; build runs schema push + seed + HNSW
index creation. See `DEPLOY.md`. Live at
https://car-voice-assistant.onrender.com/
