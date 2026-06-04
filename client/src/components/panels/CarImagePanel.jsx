import { carImageUrl, carInteriorUrl, hasInterior } from '@/lib/carImage'

const VIEW_LABEL = { front: 'Front', side: 'Side', rear: 'Rear', interior: 'Interior', default: '' }

export function CarImagePanel({ data }) {
  if (!data) return null
  const { car, brand, view = 'default' } = data
  const img = view === 'interior'
    ? (carInteriorUrl(car.slug) ?? carImageUrl(brand?.slug, car.slug, 'default'))
    : carImageUrl(brand?.slug, car.slug, view)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Big image */}
      <div className="relative bg-gradient-to-b from-white/[0.06] to-transparent flex items-center justify-center h-72">
        <img
          src={img}
          alt={`${brand?.name} ${car.model} ${VIEW_LABEL[view]}`}
          className="h-full w-full object-contain"
        />
        {VIEW_LABEL[view] && (
          <span className="absolute top-3 left-3 text-xs uppercase tracking-widest text-white/70 bg-black/40 px-2.5 py-1 rounded-full">
            {VIEW_LABEL[view]} view
          </span>
        )}
      </div>

      {/* Caption + quick view switcher */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">{brand?.name}</p>
          <p className="text-sm font-semibold text-white/85">
            {car.model}{car.trim ? ` ${car.trim}` : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          {['front', 'side', 'rear', ...(hasInterior(car.slug) ? ['interior'] : [])].map((v) => (
            <span
              key={v}
              className="text-xs px-2 py-1 rounded-full border capitalize"
              style={v === view
                ? { background: 'var(--brand-primary)', borderColor: 'transparent', color: '#fff' }
                : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
