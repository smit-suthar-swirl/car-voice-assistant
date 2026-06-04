import { PrismaClient } from '@prisma/client'
import { GoogleGenAI } from '@google/genai'

const db = new PrismaClient()
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function embed(text) {
  const result = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [text],
    config: { outputDimensionality: 1536 },
  })
  return result.embeddings[0].values
}

// ─── Brand + Car data ───────────────────────────────────────────────────────

const BRANDS = [
  {
    name: 'Honda', slug: 'honda', primaryColor: '#E40521',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/120px-Honda.svg.png',
    description: 'The power of dreams',
  },
  {
    name: 'Toyota', slug: 'toyota', primaryColor: '#EB0A1E',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/120px-Toyota_carlogo.svg.png',
    description: "Let's go places",
  },
  {
    name: 'Hyundai', slug: 'hyundai', primaryColor: '#002C5F',
    logoUrl: null, description: 'New Thinking. New Possibilities.',
  },
  {
    name: 'Mazda', slug: 'mazda', primaryColor: '#1A1A1A',
    logoUrl: null, description: 'Feel Alive',
  },
  {
    name: 'Volkswagen', slug: 'volkswagen', primaryColor: '#001E50',
    logoUrl: null, description: 'Das Auto',
  },
  {
    name: 'Nissan', slug: 'nissan', primaryColor: '#C3002F',
    logoUrl: null, description: 'Innovation That Excites',
  },
  {
    name: 'Kia', slug: 'kia', primaryColor: '#05141F',
    logoUrl: null, description: 'Movement that inspires',
  },
]

const CARS = [
  // Honda Civic — multiple trims
  {
    brand: 'honda', model: 'Civic', slug: 'civic', year: 2024, trim: 'LX', price: 2299000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    specs: { engine: '2.0L i-VTEC', hp: 158, torque: '187 Nm', fuelEconomy: '15.5 km/l', seating: 5, cargo: '430 L' },
    highlights: ['Honda Sensing safety suite', 'Apple CarPlay & Android Auto', 'Spacious cabin'],
    strengths: ['Reliability', 'Fuel efficiency', 'Safety tech standard'],
    bestFor: ['Daily commuting', 'First-time buyers', 'Long highway drives'],
  },
  {
    brand: 'honda', model: 'Civic', slug: 'civic', year: 2024, trim: 'Sport', price: 2599000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    specs: { engine: '1.5L Turbo VTEC', hp: 180, torque: '240 Nm', fuelEconomy: '13.8 km/l', seating: 5, cargo: '430 L' },
    highlights: ['Turbocharged performance', 'Sport-tuned suspension', '18-inch alloy wheels'],
    strengths: ['Sporty drive feel', 'Strong mid-range torque', 'Premium look'],
    bestFor: ['Enthusiast drivers', 'Urban performance', 'Young professionals'],
  },
  {
    brand: 'honda', model: 'Civic', slug: 'civic', year: 2024, trim: 'EX-L', price: 2999000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    specs: { engine: '1.5L Turbo VTEC', hp: 180, torque: '240 Nm', fuelEconomy: '13.5 km/l', seating: 5, cargo: '430 L' },
    highlights: ['Leather-trimmed seats', 'Panoramic sunroof', 'Heated front seats', 'Bose audio'],
    strengths: ['Premium interior quality', 'Feature-rich at price', 'Quiet cabin'],
    bestFor: ['Comfort seekers', 'Long-distance travel', 'Family use'],
  },
  {
    brand: 'honda', model: 'Civic', slug: 'civic', year: 2024, trim: 'Touring', price: 3249000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    specs: { engine: '1.5L Turbo VTEC', hp: 182, torque: '240 Nm', fuelEconomy: '13.3 km/l', seating: 5, cargo: '430 L' },
    highlights: ['Full Honda Sensing Elite', 'Wireless CarPlay', 'Digital instrument cluster', 'Adaptive cruise control'],
    strengths: ['Top-spec safety tech', 'Flagship comfort', 'Connected features'],
    bestFor: ['Tech enthusiasts', 'Highway touring', 'Premium buyers'],
  },
  {
    brand: 'honda', model: 'Civic', slug: 'civic', year: 2024, trim: 'Si', price: 3499000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    specs: { engine: '1.5L Turbo VTEC', hp: 200, torque: '260 Nm', fuelEconomy: '12.8 km/l', seating: 5, cargo: '430 L' },
    highlights: ['Sport-tuned exhaust', 'Limited-slip differential', 'Brembo front brakes', '6-speed manual option'],
    strengths: ['Driver engagement', 'Handling precision', 'Performance value'],
    bestFor: ['Performance drivers', 'Driving enthusiasts', 'Weekend fun'],
  },
  // Competitors
  {
    brand: 'toyota', model: 'Corolla', slug: 'corolla', year: 2024, trim: null, price: 2149000,
    imageUrl: null,
    specs: { engine: '1.8L Hybrid', hp: 138, torque: '142 Nm', fuelEconomy: '21.5 km/l', seating: 5, cargo: '361 L' },
    highlights: ['Hybrid powertrain', 'Toyota Safety Sense 3.0', 'LED headlights'],
    strengths: ['Outstanding fuel economy', 'Toyota reliability', 'Hybrid efficiency'],
    bestFor: ['Eco-conscious drivers', 'City commuters', 'Low running costs'],
  },
  {
    brand: 'hyundai', model: 'Elantra', slug: 'elantra', year: 2024, trim: null, price: 1999000,
    imageUrl: null,
    specs: { engine: '2.0L MPI', hp: 147, torque: '179 Nm', fuelEconomy: '14.8 km/l', seating: 5, cargo: '473 L' },
    highlights: ['Parametric dynamics design', 'Large 10.25" infotainment', 'BlueLink connected car'],
    strengths: ['Bold styling', 'Largest boot in class', 'Value for money'],
    bestFor: ['Style-conscious buyers', 'Large luggage needs', 'Budget-conscious'],
  },
  {
    brand: 'mazda', model: 'Mazda3', slug: 'mazda3', year: 2024, trim: null, price: 2449000,
    imageUrl: null,
    specs: { engine: '2.0L SkyActiv-G', hp: 155, torque: '199 Nm', fuelEconomy: '14.3 km/l', seating: 5, cargo: '358 L' },
    highlights: ['KODO soul of motion design', 'i-Activsense safety', 'Premium cabin materials'],
    strengths: ['Premium feel', 'Refined driving dynamics', 'Distinctive design'],
    bestFor: ['Discerning buyers', 'Design enthusiasts', 'Refined driving experience'],
  },
  {
    brand: 'volkswagen', model: 'Jetta', slug: 'jetta', year: 2024, trim: null, price: 2149000,
    imageUrl: null,
    specs: { engine: '1.4L TSI', hp: 150, torque: '250 Nm', fuelEconomy: '17.4 km/l', seating: 5, cargo: '510 L' },
    highlights: ['German engineering', 'Turbocharged TSI engine', 'Largest trunk in segment'],
    strengths: ['Build quality', 'European driving feel', 'Spacious boot'],
    bestFor: ['German car enthusiasts', 'Long-distance highway', 'Practical daily use'],
  },
  {
    brand: 'nissan', model: 'Sentra', slug: 'sentra', year: 2024, trim: null, price: 1799000,
    imageUrl: null,
    specs: { engine: '2.0L CVT', hp: 149, torque: '179 Nm', fuelEconomy: '16.1 km/l', seating: 5, cargo: '428 L' },
    highlights: ['ProPILOT Assist', 'D-shaped steering wheel', 'Bose audio system'],
    strengths: ['Value pricing', 'Smooth CVT', 'Tech at this price'],
    bestFor: ['Budget-conscious buyers', 'City driving', 'First car'],
  },
  {
    brand: 'kia', model: 'Forte', slug: 'forte', year: 2024, trim: null, price: 1849000,
    imageUrl: null,
    specs: { engine: '2.0L MPI', hp: 147, torque: '179 Nm', fuelEconomy: '15.0 km/l', seating: 5, cargo: '436 L' },
    highlights: ['7-year warranty', 'FWD+ safety', 'Wireless phone charging'],
    strengths: ['Best warranty', 'Safety ratings', 'Connectivity features'],
    bestFor: ['Warranty seekers', 'Young families', 'Tech features priority'],
  },
]

// ─── Showrooms ───────────────────────────────────────────────────────────────

const SHOWROOMS = [
  {
    name: 'Honda World Bandra', city: 'Mumbai', address: 'Linking Road, Bandra West, Mumbai 400050',
    phone: '+91 22 4444 1111', lat: 19.0596, lng: 72.8295, brands: ['honda'],
  },
  {
    name: 'Honda Premium Andheri', city: 'Mumbai', address: 'Andheri East, Mumbai 400069',
    phone: '+91 22 4444 2222', lat: 19.1136, lng: 72.8697, brands: ['honda', 'toyota'],
  },
  {
    name: 'Honda City Thane', city: 'Thane', address: 'Ghodbunder Road, Thane West 400615',
    phone: '+91 22 4444 3333', lat: 19.2403, lng: 72.9786, brands: ['honda'],
  },
  {
    name: 'Toyota Galaxy Powai', city: 'Mumbai', address: 'Saki Vihar Road, Powai, Mumbai 400072',
    phone: '+91 22 5555 1111', lat: 19.1196, lng: 72.9087, brands: ['toyota'],
  },
]

// ─── Reviews per car (indexed by brand:model) ─────────────────────────────────

const REVIEWS = {
  'honda:civic': [
    { reviewerName: 'Arjun Mehta', city: 'Mumbai', text: 'Switched from a Hyundai to the Civic Sport and I cannot go back. The turbo engine has incredible mid-range punch — overtaking on highways feels effortless. Build quality is a step above anything in this segment.' },
    { reviewerName: 'Priya Sharma', city: 'Pune', text: 'The EX-L interior feels genuinely premium. Leather seats, panoramic sunroof, Bose speakers — my daily commute has become something I actually look forward to. Fuel economy is better than expected for a turbocharged car.' },
    { reviewerName: 'Rahul Verma', city: 'Delhi', text: 'Honda Sensing works like a charm on long highway drives. Lane keep assist and adaptive cruise made my Pune trip essentially autopilot. Safety tech at this price point is unbeatable.' },
    { reviewerName: 'Sneha Iyer', city: 'Bangalore', text: 'Bought the LX as my first car and I am absolutely thrilled. It feels solid, the warranty support is excellent, and my colleagues constantly comment on how sharp it looks. Highly recommend for first-time buyers.' },
    { reviewerName: 'Vivek Nair', city: 'Chennai', text: 'Picked the Si over the Touring and it was the right call. The sport-tuned suspension transforms twisty roads. Feels like a proper performance car while still being practical enough for daily use.' },
    { reviewerName: 'Anita Desai', city: 'Hyderabad', text: 'The Civic Touring has wireless CarPlay and the infotainment is genuinely good. The digital cluster looks stunning. Only complaint is the rear legroom could be better for a car at this price.' },
  ],
  'toyota:corolla': [
    { reviewerName: 'Vikram Patel', city: 'Ahmedabad', text: 'The Corolla hybrid is a game-changer for city driving. Clocked 23 km/l in mixed city conditions. The seamless transition between electric and petrol is so smooth you barely notice it.' },
    { reviewerName: 'Deepa Krishnan', city: 'Chennai', text: 'Toyota reliability is no joke. My previous Corolla ran 2 lakh km without a major issue. This new hybrid generation is even better. Peace of mind you cannot put a price on.' },
  ],
  'hyundai:elantra': [
    { reviewerName: 'Rohan Singh', city: 'Jaipur', text: 'The Elantra design turns heads everywhere. The parametric grille is unlike anything else on the road. Interior tech is excellent and the 473L boot swallowed all my luggage for a family trip with room to spare.' },
    { reviewerName: 'Kavita Rao', city: 'Pune', text: 'Best value for money in the segment. You get features that cost way more in other brands. BlueLink remote start saved me multiple times in Mumbai summers.' },
  ],
}

// ─── Video reviews per car ────────────────────────────────────────────────────

const VIDEOS = {
  'honda:civic': [
    {
      youtubeId: 'gRxHsHAPJmc', title: '2024 Honda Civic Review — Is It Still the Best Compact Sedan?',
      thumbnailUrl: 'https://img.youtube.com/vi/gRxHsHAPJmc/mqdefault.jpg',
      tags: ['Full review', 'Turbo performance', 'Interior'],
      summary: 'Comprehensive review covering performance, interior quality, and value proposition of the 2024 Civic.',
    },
    {
      youtubeId: 'kd_KNx6hMp4', title: 'Honda Civic Si vs Sport — Which Should You Buy?',
      thumbnailUrl: 'https://img.youtube.com/vi/kd_KNx6hMp4/mqdefault.jpg',
      tags: ['Comparison', 'Sport vs Si', 'Performance'],
      summary: 'Side by side comparison between Sport and Si trims focusing on driving dynamics and value.',
    },
    {
      youtubeId: 'YPMFqS6f7_M', title: 'Honda Civic Touring — Long Distance Highway Test',
      thumbnailUrl: 'https://img.youtube.com/vi/YPMFqS6f7_M/mqdefault.jpg',
      tags: ['Highway', 'Comfort', 'Fuel economy', 'Honda Sensing'],
      summary: 'Real-world highway fuel economy test and comfort evaluation of the top-spec Civic Touring.',
    },
    {
      youtubeId: '7dHMuSHkMT4', title: 'Honda Civic 2024 — 6 Months Ownership Report',
      thumbnailUrl: 'https://img.youtube.com/vi/7dHMuSHkMT4/mqdefault.jpg',
      tags: ['Ownership', 'Reliability', 'Running costs'],
      summary: 'Real-owner 6-month experience report covering reliability, running costs, and long-term impressions.',
    },
  ],
  'toyota:corolla': [
    {
      youtubeId: 'EqJ1Xn_4RKE', title: 'Toyota Corolla Hybrid — Best Fuel Economy Test',
      thumbnailUrl: 'https://img.youtube.com/vi/EqJ1Xn_4RKE/mqdefault.jpg',
      tags: ['Hybrid', 'Fuel economy', 'City driving'],
      summary: 'Real-world hybrid efficiency test in city and highway conditions.',
    },
  ],
}

// ─── Seed execution ───────────────────────────────────────────────────────────

async function ensureVectorIndexes() {
  // HNSW cosine indexes for fast semantic search (idempotent).
  await db.$executeRaw`CREATE INDEX IF NOT EXISTS "Review_embedding_hnsw" ON "Review" USING hnsw (embedding vector_cosine_ops)`
  await db.$executeRaw`CREATE INDEX IF NOT EXISTS "VideoReview_embedding_hnsw" ON "VideoReview" USING hnsw (embedding vector_cosine_ops)`
}

async function main() {
  console.log('🌱 Seeding database…')

  // Enable pgvector
  await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`

  // Idempotent: if already seeded, just ensure indexes and exit (safe to run
  // on every deploy without wiping data). Pass FORCE_SEED=1 to re-seed.
  const existing = await db.brand.count().catch(() => 0)
  if (existing > 0 && process.env.FORCE_SEED !== '1') {
    console.log(`  ↪ ${existing} brands already present — skipping data seed.`)
    await ensureVectorIndexes()
    console.log('✅ Indexes ensured. Done.')
    return
  }

  // Clean existing data
  await db.$executeRaw`TRUNCATE "VideoReview", "Review", "TestDrive", "TimeSlot", "ShowroomBrand", "Showroom", "Car", "Brand" CASCADE`

  // Seed brands
  const brandMap = {}
  for (const b of BRANDS) {
    const brand = await db.brand.create({ data: b })
    brandMap[b.slug] = brand
    console.log(`  ✓ Brand: ${b.name}`)
  }

  // Seed cars
  const carMap = {}
  for (const c of CARS) {
    const { brand: brandSlug, ...rest } = c
    const car = await db.car.create({
      data: { ...rest, brandId: brandMap[brandSlug].id },
    })
    const key = `${brandSlug}:${c.slug}:${c.trim ?? 'base'}`
    carMap[key] = car
    // Also store by brand:model for reviews/videos lookup
    const simpleKey = `${brandSlug}:${c.slug}`
    if (!carMap[simpleKey]) carMap[simpleKey] = car
    console.log(`  ✓ Car: ${brandMap[brandSlug].name} ${c.model} ${c.trim ?? ''}`)
  }

  // Seed showrooms + ShowroomBrand
  const showroomMap = {}
  for (const s of SHOWROOMS) {
    const { brands: brandSlugs, ...rest } = s
    const showroom = await db.showroom.create({ data: rest })
    showroomMap[s.name] = showroom
    for (const slug of brandSlugs) {
      await db.showroomBrand.create({
        data: { showroomId: showroom.id, brandId: brandMap[slug].id },
      })
    }
    console.log(`  ✓ Showroom: ${s.name}`)
  }

  // Seed time slots — next 7 days, 9am–6pm hourly
  const showrooms = Object.values(showroomMap)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (const showroom of showrooms) {
    const slots = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 9; hour <= 17; hour++) {
        const slot = new Date(now)
        slot.setDate(slot.getDate() + day)
        slot.setHours(hour, 0, 0, 0)
        if (slot > new Date()) {
          slots.push({ showroomId: showroom.id, slot, isBooked: false })
        }
      }
    }
    await db.timeSlot.createMany({ data: slots })
  }
  console.log(`  ✓ Time slots seeded`)

  // Seed reviews with embeddings
  for (const [key, reviewList] of Object.entries(REVIEWS)) {
    const car = carMap[key]
    if (!car) { console.warn(`  ⚠ No car for review key: ${key}`); continue }
    for (const review of reviewList) {
      const embedding = await embed(review.text)
      const vector = `[${embedding.join(',')}]`
      await db.$executeRaw`
        INSERT INTO "Review" (id, "carId", "reviewerName", city, text, embedding)
        VALUES (gen_random_uuid()::text, ${car.id}, ${review.reviewerName}, ${review.city}, ${review.text}, ${vector}::vector)
      `
      process.stdout.write('.')
    }
  }
  console.log('\n  ✓ Reviews seeded with embeddings')

  // Seed video reviews with embeddings
  for (const [key, videoList] of Object.entries(VIDEOS)) {
    const car = carMap[key]
    if (!car) { console.warn(`  ⚠ No car for video key: ${key}`); continue }
    for (const video of videoList) {
      const embedding = await embed(`${video.title} ${video.summary}`)
      const vector = `[${embedding.join(',')}]`
      await db.$executeRaw`
        INSERT INTO "VideoReview" (id, "carId", title, "youtubeId", "thumbnailUrl", tags, summary, embedding)
        VALUES (
          gen_random_uuid()::text, ${car.id}, ${video.title}, ${video.youtubeId},
          ${video.thumbnailUrl}, ${video.tags}, ${video.summary},
          ${vector}::vector
        )
      `
      process.stdout.write('.')
    }
  }
  console.log('\n  ✓ Videos seeded with embeddings')

  await ensureVectorIndexes()
  console.log('  ✓ HNSW vector indexes ensured')

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
