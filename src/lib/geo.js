import { siteById } from '../data/sites.js'

const EARTH_RADIUS_KM = 6371
const toRad = (deg) => (deg * Math.PI) / 180

/** Great-circle distance in km between two lat/lng points. */
export function distanceKm(a, b) {
  if (!a || !b) return null
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Test a logged position against the boundary of the site the unit is
 * assigned to. This is what turns "geofence breach" from a hardcoded
 * incident into something derived from the usage log.
 */
export function geofenceCheck(location, siteId) {
  const site = siteId ? siteById[siteId] : null
  if (!location || !site || location.lat == null || location.lng == null) return null

  const km = distanceKm(location, { lat: site.lat, lng: site.lng })
  return {
    site,
    distanceKm: km,
    radiusKm: site.radiusKm,
    breach: km > site.radiusKm,
    overshootKm: Math.max(0, km - site.radiusKm),
  }
}

/** A point offset from a site centre — used to simulate on-site / off-site pings. */
export function pointNearSite(siteId, offsetKm = 0) {
  const site = siteById[siteId]
  if (!site) return null
  // ~111 km per degree of latitude; offset due north keeps the maths obvious.
  return {
    lat: +(site.lat + offsetKm / 111).toFixed(5),
    lng: site.lng,
  }
}
