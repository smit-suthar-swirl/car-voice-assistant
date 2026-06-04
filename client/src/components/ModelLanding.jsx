import { motion } from 'framer-motion'
import { carImageUrl } from '@/lib/carImage'

export function ModelLanding({ brand, models, onSelect, onBack }) {
  // Group by model name, pick the base trim for display
  const unique = models.reduce((acc, car) => {
    if (!acc.find((c) => c.slug === car.slug)) acc.push(car)
    return acc
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <button onClick={onBack} className="text-xs text-white/30 hover:text-white/60 mb-3 flex items-center gap-1 mx-auto">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-white">{brand.name}</h1>
        <p className="text-sm text-white/40 mt-1">Select a model</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {unique.map((car, i) => (
          <motion.button
            key={car.id}
            onClick={() => onSelect(car)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl border border-white/10 bg-white/4 p-4 hover:bg-white/8 hover:border-white/20 transition-colors text-left"
          >
            <img src={carImageUrl(brand.slug, car.slug)} alt={car.model} className="h-20 w-full object-contain mb-3" />
            <p className="text-sm font-bold text-white">{car.model}</p>
            <p className="text-xs text-white/40 mt-0.5">
              From ₹{(car.price / 100000).toFixed(1)}L · {car.year}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
