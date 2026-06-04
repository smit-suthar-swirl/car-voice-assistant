import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import { hasInterior } from '@/lib/carImage'
import { MicButton, MuteButton } from './MicButton'
import { Waveform } from './Waveform'
import { CarHeroPanel } from './panels/CarHeroPanel'
import { CarImagePanel } from './panels/CarImagePanel'
import { ComparisonPanel } from './panels/ComparisonPanel'
import { VideosPanel } from './panels/VideosPanel'
import { ReviewsPanel } from './panels/ReviewsPanel'
import { BookingNearbyPanel } from './panels/BookingNearbyPanel'
import { BookingTimeSlotsPanel } from './panels/BookingTimeSlotsPanel'
import { BookingConfirmPanel } from './panels/BookingConfirmPanel'
import { BookingSuccessPanel } from './panels/BookingSuccessPanel'

// Match the agent's chosen time to a real slot. Accepts an exact ISO, or an
// approximate value (label / time phrase) → returns the canonical ISO or null.
function resolveSlot(chosen, slots) {
  if (!chosen || !slots?.length) return null
  // 1. exact ISO match
  const exact = slots.find((s) => s.slot === chosen)
  if (exact) return exact.slot
  // 2. parseable date → nearest slot within 90 min
  const t = Date.parse(chosen)
  if (!Number.isNaN(t)) {
    let best = null, bestDiff = Infinity
    for (const s of slots) {
      const diff = Math.abs(Date.parse(s.slot) - t)
      if (diff < bestDiff) { bestDiff = diff; best = s }
    }
    if (best && bestDiff <= 90 * 60 * 1000) return best.slot
  }
  // 3. substring match against the readable label
  const lc = String(chosen).toLowerCase()
  const byLabel = slots.find((s) =>
    new Date(s.slot).toLocaleString('en-IN', {
      weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true,
    }).toLowerCase().includes(lc)
  )
  return byLabel ? byLabel.slot : null
}

export function VoiceAssistant({ brand, car }) {
  const {
    setContext, setBooking, clearBooking, clearAll,
    addBlock, showPanel,
    contentBlocks, streamingText, lastResponse, activePanel, panelData,
    status, error,
  } = useAssistantStore()

  const scrollRef = useRef(null)
  const showroomsRef = useRef([]) // last shown showrooms (id↔name mapping for the model)
  const slotsRef = useRef([])

  useEffect(() => {
    setContext(brand, car)
    if (brand?.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', brand.primaryColor)
    }
  }, [brand, car, setContext])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [contentBlocks.length, lastResponse])

  const handleToolCall = useCallback(async (name, args) => {
    switch (name) {
      // Display tools — fire the fetch in the background and reply to the model
      // INSTANTLY so its speech is never blocked on a DB round-trip.
      case 'show_car_info': {
        // Await (local cached API, ~fast) and RETURN the real specs so the
        // agent quotes accurate numbers instead of guessing.
        const params = new URLSearchParams({ brand: brand.slug, model: car.slug })
        if (args.trim) params.set('trim', args.trim)
        const data = await fetch(`/api/cars?${params}`).then((r) => r.json())
        const shown = data.cars?.[0] ?? car
        const requestedView = ['front', 'side', 'rear', 'interior'].includes(args.view) ? args.view : null
        const sp = shown.specs ?? {}

        // A specific view was requested → show JUST a big image, not the spec card
        if (requestedView) {
          const interiorMissing = requestedView === 'interior' && !hasInterior(shown.slug)
          const view = interiorMissing ? 'front' : requestedView
          addBlock('car-image', { car: shown, brand, view })
          return {
            shownView: view,
            instruction: interiorMissing
              ? 'Interior photo is not available for this model — briefly tell the user and mention you can show the front, side, or rear instead.'
              : `Showing the ${view} view. Say one short, natural sentence about it.`,
          }
        }

        // General specs request → full spec card
        addBlock('car-hero', { car: shown, brand, view: 'default' })
        return {
          model: `${brand.name} ${shown.model}${shown.trim ? ' ' + shown.trim : ''}`,
          price: `₹${(shown.price / 100000).toFixed(1)}L`,
          engine: sp.engine, horsepower: sp.hp, torque: sp.torque,
          fuelEconomy: sp.fuelEconomy, seating: sp.seating,
          highlights: shown.highlights,
          instruction: 'These are the exact specs now on screen. Use these numbers — do not state any figure not listed here.',
        }
      }
      case 'show_comparison': {
        ;(async () => {
          const compBrand = args.competitorBrand?.toLowerCase().replace(/\s+/g, '-') ?? ''
          const compModel = args.competitorModel?.toLowerCase().replace(/\s+/g, '') ?? ''
          const [resA, resB] = await Promise.all([
            fetch(`/api/cars?brand=${brand.slug}&model=${car.slug}`).then((r) => r.json()),
            fetch(`/api/cars?brand=${encodeURIComponent(compBrand)}&model=${encodeURIComponent(compModel)}`).then((r) => r.json()),
          ])
          if (resA.cars?.[0] && resB.cars?.[0]) {
            addBlock('comparison', { carA: resA.cars[0], brandA: brand, carB: resB.cars[0], brandB: resB.brand })
          }
        })()
        return { status: 'Comparison is now on screen.' }
      }
      case 'show_videos': {
        ;(async () => {
          const params = new URLSearchParams({ carId: car.id })
          if (args.query) params.set('query', args.query)
          const data = await fetch(`/api/videos?${params}`).then((r) => r.json())
          addBlock('videos', data)
        })()
        return { status: 'Video reviews are now on screen.' }
      }
      case 'show_reviews': {
        ;(async () => {
          const params = new URLSearchParams({ carId: car.id })
          if (args.query) params.set('query', args.query)
          const data = await fetch(`/api/reviews?${params}`).then((r) => r.json())
          addBlock('reviews', data)
        })()
        return { status: 'Customer reviews are now on screen.' }
      }
      case 'show_nearby_showrooms': {
        clearBooking()
        setBooking({ name: args.name, mobile: args.mobile })
        const data = await fetch(`/api/showrooms?brand=${brand.slug}&lat=${args.lat}&lng=${args.lng}`).then((r) => r.json())
        showroomsRef.current = data.showrooms ?? []
        showPanel('booking-nearby', data)
        // Give the model the list so it can resolve "the first one" / "Bandra"
        return {
          showrooms: showroomsRef.current.map((s, i) => ({
            number: i + 1, id: s.id, name: s.name, city: s.city, distanceKm: s.distanceKm,
          })),
          instruction: 'Ask which showroom they prefer. When they pick one (by number or name), call show_time_slots with that showroom id.',
        }
      }
      case 'show_time_slots': {
        const sr = showroomsRef.current.find((x) => x.id === args.showroomId)
        setBooking({ showroomId: args.showroomId, showroomName: sr?.name ?? '' })
        const data = await fetch(`/api/showrooms/${args.showroomId}/slots`).then((r) => r.json())
        slotsRef.current = data.slots ?? []
        showPanel('booking-slots', data)
        return {
          showroom: sr?.name,
          slots: slotsRef.current.map((sl) => ({
            slot: sl.slot,
            label: new Date(sl.slot).toLocaleString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
            }),
          })),
          instruction: 'Read out a few options. When the customer picks a time, immediately call confirm_booking with that slot value — do NOT just say it is available.',
        }
      }
      case 'confirm_booking': {
        // Resolve the agent's chosen slot against the real options. The model
        // may pass an ISO, a label, or an approximate time — match it robustly.
        const resolved = resolveSlot(args.slot, slotsRef.current)
        if (!resolved) {
          return { status: 'That time is not available. Offer one of the listed times instead.' }
        }
        setBooking({ slot: resolved })
        showPanel('booking-confirm', {})
        return {
          status: 'Confirmation summary is on screen. Briefly read it back and ask the customer to confirm.',
          slot: resolved,
        }
      }
      case 'book_test_drive': {
        const booking = useAssistantStore.getState().booking
        const res = await fetch('/api/test-drive', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...booking, carId: car.id }),
        })
        const data = await res.json()
        showPanel('booking-success', { bookingId: data.id })
        return { status: 'Booked and saved. Warmly confirm the test drive is scheduled.' }
      }
      default: return null
    }
  }, [brand, car, addBlock, showPanel, setBooking, clearBooking])

  const { connect, disconnect, prefetch } = useGeminiLive({ onToolCall: handleToolCall })

  // Pre-mint the session token as soon as the car page loads, so tapping the
  // mic skips the ~500ms token round-trip and connects almost instantly.
  useEffect(() => {
    if (brand?.slug && car?.slug) prefetch({ brandSlug: brand.slug, modelSlug: car.slug })
  }, [brand, car, prefetch])

  const handleConnect = useCallback(() => {
    clearAll()
    connect({ brandSlug: brand.slug, modelSlug: car.slug })
  }, [connect, brand, car, clearAll])

  const handleShowroomSelect = useCallback((showroom) => {
    setBooking({ showroomId: showroom.id, showroomName: showroom.name })
    fetch(`/api/showrooms/${showroom.id}/slots`).then((r) => r.json()).then((data) => showPanel('booking-slots', data))
  }, [setBooking, showPanel])

  const handleSlotSelect = useCallback((slot) => {
    setBooking({ slot: slot.slot })
    showPanel('booking-confirm', {})
  }, [setBooking, showPanel])

  const handleConfirm = useCallback(async () => {
    const booking = useAssistantStore.getState().booking
    const res = await fetch('/api/test-drive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...booking, carId: car.id }),
    })
    const data = await res.json()
    showPanel('booking-success', { bookingId: data.id })
  }, [car, showPanel])

  const handleEdit = useCallback(() => {
    const { booking } = useAssistantStore.getState()
    fetch(`/api/showrooms/${booking.showroomId}/slots`).then((r) => r.json()).then((data) => showPanel('booking-slots', data))
  }, [showPanel])

  // Show the hint ONLY before the session starts — never between answers
  // (status is 'listening' between turns, so this won't flash on clear)
  const showHint = status === 'idle' && contentBlocks.length === 0 && !lastResponse && !activePanel
  const responseText = streamingText || lastResponse

  const statusLabel =
    status === 'idle' ? 'Tap to start talking' :
    status === 'connecting' ? 'Connecting…' :
    status === 'listening' ? 'Listening' :
    status === 'speaking' ? 'Speaking' : ''

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-[#08080b]">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          {brand?.logoUrl
            ? <img src={brand.logoUrl} alt={brand.name} className="h-5 object-contain" />
            : <div className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />}
          <span className="text-sm font-semibold text-white/85 truncate">{brand?.name} {car?.model}</span>
        </div>
        <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-medium flex-shrink-0 hidden sm:block">AI Voice Assistant</span>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-5 min-h-full">

          {showHint && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                style={{ background: 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="1.6" className="w-7 h-7">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 16.93V21m-4 0h8M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white/80">Ask me about the {car?.model}</h2>
              <p className="text-sm text-white/35 max-w-sm">
                Specs & features · Compare with other cars · Watch reviews · Book a test drive — all by voice.
              </p>
            </div>
          )}

          {responseText && (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-[17px] text-white/90 leading-relaxed font-medium"
            >
              {responseText}
            </motion.p>
          )}

          {contentBlocks.map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ContentBlock block={block} />
            </motion.div>
          ))}

          <AnimatePresence mode="wait">
            {activePanel === 'booking-nearby' && (
              <motion.div key="nearby" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <BookingNearbyPanel data={panelData} onSelect={handleShowroomSelect} />
              </motion.div>
            )}
            {activePanel === 'booking-slots' && (
              <motion.div key="slots" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <BookingTimeSlotsPanel data={panelData} onSelect={handleSlotSelect} />
              </motion.div>
            )}
            {activePanel === 'booking-confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <BookingConfirmPanel onConfirm={handleConfirm} onEdit={handleEdit} />
              </motion.div>
            )}
            {activePanel === 'booking-success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <BookingSuccessPanel data={panelData} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>
      </div>

      {/* ── Error toast ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Control bar (compact single row) ─────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0e]/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-3">
          {/* left: status (hidden on very small screens to keep mic centred) */}
          <div className="hidden sm:flex w-40 justify-end">
            <StatusPill label={statusLabel} status={status} />
          </div>
          <MicButton onConnect={handleConnect} onDisconnect={disconnect} />
          {/* right: waveform + mute */}
          <div className="flex items-center gap-2 sm:gap-3 w-32 sm:w-40">
            <Waveform />
            <MuteButton />
          </div>
        </div>
        {/* status under the mic on mobile (where the side pill is hidden) */}
        <div className="sm:hidden flex justify-center pb-2 -mt-1">
          <StatusPill label={statusLabel} status={status} />
        </div>
      </div>
    </div>
  )
}

function StatusPill({ label, status }) {
  const muted = useAssistantStore((s) => s.muted)
  const dotColor =
    status === 'listening' ? '#34d399' :
    status === 'speaking' ? 'var(--brand-primary)' :
    status === 'connecting' ? '#fbbf24' : 'rgba(255,255,255,0.3)'

  return (
    <div className="flex items-center gap-2 h-5">
      {status !== 'idle' && (
        <motion.span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dotColor }}
          animate={status === 'listening' || status === 'speaking' ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <span className="text-xs text-white/40">
        {muted && status !== 'idle' ? 'Muted — tap mic icon to unmute' : label}
      </span>
    </div>
  )
}

function ContentBlock({ block }) {
  switch (block.type) {
    case 'car-hero':   return <CarHeroPanel data={block.data} />
    case 'car-image':  return <CarImagePanel data={block.data} />
    case 'comparison': return <ComparisonPanel data={block.data} />
    case 'videos':     return <VideosPanel data={block.data} />
    case 'reviews':    return <ReviewsPanel data={block.data} />
    default:           return null
  }
}
