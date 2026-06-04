import { useAssistantStore } from '@/store/assistant'
import { cn } from '@/lib/cn'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function groupByDay(slots) {
  return slots.reduce((acc, slot) => {
    const day = new Date(slot.slot).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(slot)
    return acc
  }, {})
}

export function BookingTimeSlotsPanel({ data, onSelect }) {
  const booking = useAssistantStore((s) => s.booking)

  if (!data?.slots?.length) return (
    <div className="flex items-center justify-center py-10">
      <p className="text-white/40 text-sm">Loading available slots…</p>
    </div>
  )

  const grouped = groupByDay(data.slots)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Select Time Slot</p>
      <p className="text-xs text-white/30 mb-4">{booking.showroomName}</p>
      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([day, slots]) => (
          <div key={day}>
            <p className="text-xs font-semibold text-white/50 mb-2">{formatDate(slots[0].slot)}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  disabled={s.isBooked}
                  onClick={() => !s.isBooked && onSelect(s)}
                  className={cn(
                    'rounded-lg py-2 px-2 text-xs font-medium transition-all border',
                    s.isBooked
                      ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed line-through'
                      : 'bg-white/6 border-white/10 text-white/70 hover:bg-white/12 hover:border-white/25 hover:text-white',
                  )}
                >
                  {formatTime(s.slot)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
