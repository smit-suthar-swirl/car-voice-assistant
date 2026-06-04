import { carImageUrl, carInteriorUrl } from '@/lib/carImage'

const VIEW_LABEL = { front: 'Front', side: 'Side', rear: 'Rear', interior: 'Interior', default: '' }

export function CarHeroPanel({ data }) {
  if (!data) return null
  const { car, brand, view = 'default' } = data
  const specs = car.specs ?? {}
  const img = view === 'interior'
    ? (carInteriorUrl(car.slug) ?? carImageUrl(brand?.slug, car.slug, 'default'))
    : carImageUrl(brand?.slug, car.slug, view)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Image (model-accurate, view-specific) */}
        <div className="relative rounded-xl overflow-hidden bg-white/5 flex-shrink-0 w-full sm:w-44 h-36 sm:h-28 flex items-center justify-center">
          <img src={img} alt={`${brand?.name} ${car.model} ${VIEW_LABEL[view]}`} className="h-full w-full object-contain" />
          {VIEW_LABEL[view] && (
            <span className="absolute bottom-1 left-1 text-[10px] uppercase tracking-wider text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
              {VIEW_LABEL[view]}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 uppercase tracking-widest">{brand?.name}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{car.model} {car.trim && <span className="text-base sm:text-lg font-normal text-white/50">{car.trim}</span>}</h2>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>
            ₹{(car.price / 100000).toFixed(1)}L
          </p>
          <p className="text-xs text-white/30 mt-0.5">{car.year}</p>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/5">
        {specs.engine && <SpecCell label="Engine" value={specs.engine} />}
        {specs.hp && <SpecCell label="Power" value={`${specs.hp} hp`} />}
        {specs.fuelEconomy && <SpecCell label="Fuel Economy" value={specs.fuelEconomy} />}
        {specs.torque && <SpecCell label="Torque" value={specs.torque} />}
        {specs.seating && <SpecCell label="Seating" value={`${specs.seating} seats`} />}
        {specs.cargo && <SpecCell label="Cargo" value={specs.cargo} />}
      </div>

      {/* Highlights + Best for */}
      <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-5 py-4 border-t border-white/5">
        {car.highlights?.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Highlights</p>
            <div className="flex flex-wrap gap-1.5">
              {car.highlights.map((h) => (
                <span key={h} className="text-xs bg-white/6 text-white/60 px-2 py-0.5 rounded-full border border-white/8">{h}</span>
              ))}
            </div>
          </div>
        )}
        {car.bestFor?.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Best For</p>
            {car.bestFor.map((b) => (
              <p key={b} className="text-xs text-white/60 flex items-center gap-1.5 mb-1">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />{b}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SpecCell({ label, value }) {
  return (
    <div className="bg-white/3 px-3 py-2.5">
      <p className="text-xs text-white/35">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  )
}
