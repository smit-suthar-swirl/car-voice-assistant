import { motion } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'

export function BookingSuccessPanel({ data }) {
  const booking = useAssistantStore((s) => s.booking)

  const slotFormatted = booking.slot
    ? new Date(booking.slot).toLocaleString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-6 flex flex-col items-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'var(--brand-primary)' }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </motion.div>

      <div>
        <h3 className="text-xl font-bold text-white">Test Drive Booked!</h3>
        <p className="text-sm text-white/40 mt-1">See you at the showroom</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/4 p-4 w-full text-left space-y-2">
        <Detail label="Name" value={booking.name} />
        <Detail label="Mobile" value={booking.mobile} />
        <Detail label="Showroom" value={booking.showroomName} />
        <Detail label="Slot" value={slotFormatted} />
        {data?.bookingId && <Detail label="Booking ID" value={data.bookingId} mono />}
      </div>

      {booking.slot && (
        <a
          href={calendarUrl(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/50 underline underline-offset-2 hover:text-white/80 transition-colors"
        >
          + Add to Calendar
        </a>
      )}
    </div>
  )
}

function Detail({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-xs font-medium text-white/70 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function calendarUrl(booking) {
  const start = new Date(booking.slot)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Test+Drive&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(booking.showroomName)}`
}
