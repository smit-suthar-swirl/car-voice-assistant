// Accurate, model-specific car images rendered on demand by imagin.studio
// (no per-car URLs to maintain). The angle code picks the viewpoint.
const VIEW_ANGLE = {
  default: '23', // front 3/4 — the hero shot
  front: '29',   // straight-on front
  side: '21',    // side profile
  rear: '13',    // straight-on rear
}

export const CAR_VIEWS = [...Object.keys(VIEW_ANGLE), 'interior']

// Interior shots aren't available from imagin — curated real photos from
// Wikimedia Commons (hotlinkable via Special:FilePath). Add a model slug +
// filename here to enable interior for more cars.
const INTERIOR_FILE = {
  civic: '2013–2015_Honda_Civic_EX-L_interior_(United_States).jpg',
  elantra: '2020_Hyundai_Elantra_Interior.jpg',
  corolla: '2005_toyota_corolla_s_dashboard.jpg',
}

/** Returns an interior image URL for the model, or null if none is curated. */
export function carInteriorUrl(model) {
  const file = INTERIOR_FILE[String(model || '').toLowerCase()]
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}` : null
}

export function hasInterior(model) {
  return Boolean(INTERIOR_FILE[String(model || '').toLowerCase()])
}

/**
 * @param {string} make  brand slug, e.g. "honda"
 * @param {string} model model slug / family, e.g. "civic"
 * @param {string} view  one of CAR_VIEWS (front | side | rear | default)
 */
// Swap the demo key for a paid imagin customer id in production via env.
const IMAGIN_CUSTOMER = import.meta.env.VITE_IMAGIN_CUSTOMER || 'img'

export function carImageUrl(make, model, view = 'default') {
  const angle = VIEW_ANGLE[view] ?? VIEW_ANGLE.default
  const params = new URLSearchParams({
    customer: IMAGIN_CUSTOMER,
    make: String(make || '').toLowerCase(),
    modelFamily: String(model || '').toLowerCase(),
    angle,
    zoomType: 'fullscreen',
  })
  return `https://cdn.imagin.studio/getImage?${params}`
}
