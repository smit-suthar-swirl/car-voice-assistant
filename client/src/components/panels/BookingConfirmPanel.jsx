import { useAssistantStore } from '@/store/assistant'

export function BookingConfirmPanel({ onConfirm, onEdit }) {
  const booking = useAssistantStore((s) => s.booking)

  const slotFormatted = booking.slot
    ? new Date(booking.slot).toLocaleString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5 flex flex-col gap-5">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Confirm Booking</p>
        <p className="text-sm text-white/40">Please review your test drive details</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/4 divide-y divide-white/6">
        <Row label="Name" value={booking.name} />
        <Row label="Mobile" value={booking.mobile} />
        <Row label="Showroom" value={booking.showroomName} />
        <Row label="Date & Time" value={slotFormatted} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 py-3 rounded-xl border border-white/15 text-sm text-white/60 hover:bg-white/6 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--brand-primary)' }}
        >
          Confirm Booking
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-sm font-medium text-white/80 text-right max-w-[60%]">{value}</p>
    </div>
  )
}
