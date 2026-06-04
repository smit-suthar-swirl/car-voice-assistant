import { cn } from '@/lib/cn'
import { carImageUrl } from '@/lib/carImage'

export function ComparisonPanel({ data }) {
  if (!data) return null
  const { carA, carB, brandA, brandB } = data

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <CarCard car={carA} brand={brandA} highlight />
        <CarCard car={carB} brand={brandB} />
      </div>
    </div>
  )
}

function CarCard({ car, brand, highlight }) {
  const specs = car.specs ?? {}

  return (
    <div className={cn(
      'rounded-2xl border p-4 flex flex-col gap-3',
      highlight ? 'border-white/20 bg-white/6' : 'border-white/8 bg-white/3',
    )}>
      {highlight && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-start"
          style={{ background: 'var(--brand-primary)', color: '#fff' }}>✓ Best</span>
      )}

      <div className="rounded-xl bg-white/5 h-32 flex items-center justify-center overflow-hidden">
        <img src={carImageUrl(brand?.slug, car.slug)} alt={car.model} className="h-full w-full object-contain" />
      </div>

      <div>
        <p className="text-xs text-white/40">{brand?.name}</p>
        <p className="font-bold text-white text-lg">{car.model}</p>
      </div>

      <Row label="Price" value={`₹${(car.price / 100000).toFixed(1)}L`} accent={highlight} />
      {specs.engine && <Row label="Engine" value={specs.engine} />}
      {specs.hp && <Row label="Power" value={`${specs.hp} hp`} />}
      {specs.fuelEconomy && <Row label="Fuel Economy" value={specs.fuelEconomy} />}

      {car.highlights?.length > 0 && (
        <Section title="Highlights" items={car.highlights.slice(0, 3)} color="var(--brand-primary)" />
      )}
      {car.strengths?.length > 0 && (
        <Section title="Key Strengths" items={car.strengths.slice(0, 3)} color="#4ade80" />
      )}
      {car.bestFor?.length > 0 && (
        <Section title="Best For" items={car.bestFor.slice(0, 2)} color="#facc15" />
      )}
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between py-1 border-b border-white/5">
      <p className="text-xs text-white/40">{label}</p>
      <p className={cn('text-xs font-medium', accent ? 'text-white' : 'text-white/70')}>{value}</p>
    </div>
  )
}

function Section({ title, items, color }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{title}</p>
      {items.map((item) => (
        <p key={item} className="text-xs text-white/60 flex items-start gap-1.5 mb-0.5">
          <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />{item}
        </p>
      ))}
    </div>
  )
}
