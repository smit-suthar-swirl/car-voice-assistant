import { useAssistantStore } from '@/store/assistant'

export function BookingNearbyPanel({ data, onSelect }) {
  const booking = useAssistantStore((s) => s.booking)

  if (!data?.showrooms?.length) return (
    <div className="flex items-center justify-center py-10">
      <p className="text-white/40 text-sm">Locating showrooms near you…</p>
    </div>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Select Showroom</p>
      <p className="text-xs text-white/30 mb-4">Booking for <span className="text-white/60">{booking.name}</span></p>
      <div className="flex flex-col gap-3">
        {data.showrooms.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="text-left rounded-xl border border-white/10 bg-white/4 p-4 hover:bg-white/8 hover:border-white/25 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-xs text-white/50 group-hover:border-white/35">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white">{s.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.address}, {s.city}</p>
                </div>
              </div>
              {s.distanceKm != null && (
                <span className="text-xs text-white/40 bg-white/6 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                  {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)}m` : `${s.distanceKm.toFixed(1)}km`}
                </span>
              )}
            </div>
            <p className="text-xs text-white/30 mt-2 ml-10">{s.phone}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
