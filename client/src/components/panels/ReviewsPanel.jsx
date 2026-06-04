export function ReviewsPanel({ data }) {
  if (!data?.reviews?.length) return null

  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>★</span> Reviews
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
            <span className="text-3xl leading-none text-white/15 font-serif block mb-2">"</span>
            <p className="text-sm text-white/65 leading-relaxed line-clamp-5">{r.text}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/6">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-semibold flex-shrink-0">
                {r.reviewerName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/55 truncate">— {r.reviewerName}</p>
                <p className="text-xs text-white/25 truncate">{r.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
