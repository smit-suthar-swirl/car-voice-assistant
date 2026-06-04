export function VideosPanel({ data }) {
  if (!data?.videos?.length) return null

  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>▶</span> Videos
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.videos.map((v) => (
          <a
            key={v.youtubeId}
            href={`https://youtube.com/watch?v=${v.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden border border-white/8 bg-white/3 hover:border-white/20 transition-colors"
          >
            <div className="relative h-24 bg-black overflow-hidden">
              <img
                src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-white/70 line-clamp-2 leading-snug mb-1.5">{v.title}</p>
              {v.tags?.slice(0, 2).map((t) => (
                <span key={t} className="inline-block text-xs text-white/35 mr-1">✓ {t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
