import { motion } from 'framer-motion'

export function BrandLanding({ brands, onSelect }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Car Voice Assistant</h1>
        <p className="text-sm text-white/40 mt-2">Select a brand to start</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-lg">
        {brands.map((brand, i) => (
          <motion.button
            key={brand.id}
            onClick={() => onSelect(brand)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl border border-white/10 bg-white/4 p-5 hover:bg-white/8 hover:border-white/20 transition-colors flex flex-col items-center gap-3"
          >
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-10 object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: brand.primaryColor || '#333' }}
              >
                {brand.name[0]}
              </div>
            )}
            <span className="text-sm font-medium text-white/70">{brand.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
