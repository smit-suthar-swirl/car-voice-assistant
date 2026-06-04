import { useState, useEffect } from 'react'
import { BrandLanding } from './components/BrandLanding'
import { ModelLanding } from './components/ModelLanding'
import { VoiceAssistant } from './components/VoiceAssistant'

export default function App() {
  const [view, setView] = useState('brands') // 'brands' | 'models' | 'assistant'
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [brandModels, setBrandModels] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => setBrands(data.brands ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleBrandSelect = async (brand) => {
    setSelectedBrand(brand)
    const data = await fetch(`/api/cars?brand=${brand.slug}`).then((r) => r.json())
    setBrandModels(data.cars ?? [])
    setView('models')
  }

  const handleModelSelect = (car) => {
    setSelectedCar(car)
    setView('assistant')
  }

  const handleBack = () => {
    setView('brands')
    setSelectedBrand(null)
    setBrandModels([])
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  if (view === 'assistant' && selectedBrand && selectedCar) {
    return <VoiceAssistant brand={selectedBrand} car={selectedCar} />
  }

  if (view === 'models' && selectedBrand) {
    return (
      <ModelLanding
        brand={selectedBrand}
        models={brandModels}
        onSelect={handleModelSelect}
        onBack={handleBack}
      />
    )
  }

  return <BrandLanding brands={brands} onSelect={handleBrandSelect} />
}
