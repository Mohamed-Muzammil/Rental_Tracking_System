import { useState } from 'react'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { siteById } from '../../data/sites'
import { useAppStore } from '../../store/appStore'

export default function LocationModal({ eq, onClose }) {
  const [copied, setCopied] = useState(false)
  const [showLiveMap, setShowLiveMap] = useState(false)
  const misuseIncidents = useAppStore((s) => s.misuseIncidents)
  
  const activeIncident = misuseIncidents.find(
    (i) => i.equipmentId === eq.id && i.status === 'active'
  )

  const isAnomaly = Boolean(activeIncident) || Boolean(eq.locationAnomaly) || Boolean(eq.contractSiteId && eq.contractSiteId !== eq.siteId)

  // Actual current telemetry coordinates & site
  const actualSiteId = activeIncident?.actualSiteId || (eq.locationAnomaly ? eq.siteId : (eq.siteId || 'TAMBARAM'))
  const actualSite = siteById[actualSiteId] || siteById['TAMBARAM']
  
  const lat = eq.currentLocation?.lat ?? actualSite?.lat ?? 12.9249
  const lng = eq.currentLocation?.lng ?? actualSite?.lng ?? 80.1000
  const locationName = actualSite?.locationName ?? actualSite?.name ?? 'Tambaram'
  const cityName = 'Chennai'
  const regionName = actualSite?.region ?? 'Chennai South'
  const siteName = actualSite?.name ?? 'Tambaram Railway Yard'
  const radiusKm = actualSite?.radiusKm ?? 2.5

  // Original contracted site
  const contractSiteId = activeIncident?.contractSiteId || eq.contractSiteId || 'ANNA-NAGAR'
  const contractSite = siteById[contractSiteId] || siteById['ANNA-NAGAR']
  const contractLat = contractSite?.lat ?? 13.0850
  const contractLng = contractSite?.lng ?? 80.2101
  const contractLocationName = contractSite?.locationName ?? contractSite?.name ?? 'Anna Nagar'
  const contractSiteName = contractSite?.name ?? 'Anna Nagar Metro Hub'

  const copyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border p-6 shadow-2xl transition-all"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          color: 'var(--ink-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: isAnomaly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isAnomaly ? '#ef4444' : '#3b82f6',
              }}
            >
              <Icon name={isAnomaly ? 'alertTriangle' : 'mapPin'} size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                {isAnomaly ? '🚨 Telematics Anomaly Location Report' : 'GPS Telemetry Location'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {eq.id} • {eq.type} ({eq.tier})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-black/10"
            style={{ color: 'var(--ink-muted)' }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Location Display: Side-by-side for Anomaly Comparison */}
        {isAnomaly ? (
          <div className="mb-4 flex flex-col gap-2.5">
            {/* Anomaly Breach Banner */}
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444' }}
            >
              <span>🚨 SITE MISMATCH DETECTED</span>
              <span>{activeIncident.distanceOffsetKm ?? 18.5} km Unauthorized Offset</span>
            </div>

            {/* Original vs Current Location Comparison Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Original Contracted Location */}
              <div
                className="rounded-lg p-3 border"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  📌 Original Contract Site
                </span>
                <h5 className="text-sm font-extrabold mt-0.5" style={{ color: 'var(--ink-primary)' }}>
                  {contractLocationName}, Chennai
                </h5>
                <p className="text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  {contractSiteName}
                </p>
                <span className="mt-1 block font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                  {contractLat.toFixed(4)}° N, {contractLng.toFixed(4)}° E
                </span>
              </div>

              {/* Current Detected Location */}
              <div
                className="rounded-lg p-3 border"
                style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  🚨 Current Live Location
                </span>
                <h5 className="text-sm font-extrabold mt-0.5 text-red-500">
                  {locationName}, Chennai
                </h5>
                <p className="text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  {siteName}
                </p>
                <span className="mt-1 block font-mono text-[10px]" style={{ color: '#ef4444' }}>
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mb-4 flex items-center justify-between rounded-lg p-3.5"
            style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#3b82f6' }}>
                Chennai Location
              </span>
              <h4 className="text-lg font-extrabold" style={{ color: 'var(--ink-primary)' }}>
                📍 {locationName}, {cityName}
              </h4>
              <p className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                {siteName} (Site ID: {eq.siteId ?? 'ANNA-NAGAR'})
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Geofence Verified
            </span>
          </div>
        )}

        {/* Toggleable Map View (Interactive Embed vs Satellite Pin) */}
        {showLiveMap ? (
          <div className="relative mb-4 h-60 w-full overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
            <iframe
              title="Chennai Equipment GPS Location"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={mapEmbedUrl}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div
            className="relative mb-4 flex h-52 w-full flex-col justify-between overflow-hidden rounded-lg border p-4"
            style={{
              background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Simulated Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0f172a 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            />

            {/* Marker Pin in Center */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/30 p-2 shadow-lg backdrop-blur-md border border-blue-400/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow">
                  <Icon name="truck" size={16} />
                </div>
              </div>
              <div className="mt-2 rounded-md bg-slate-900/90 px-3 py-1 text-center shadow-lg border border-slate-700">
                <span className="block text-xs font-extrabold text-sky-400">{locationName}, Chennai</span>
                <span className="block text-[10px] text-slate-300">
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                </span>
              </div>
            </div>

            {/* Map Footer Overlay */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Boundary: {radiusKm} km radius</span>
              <span>Region: {regionName}</span>
            </div>
          </div>
        )}

        {/* Map Toggle & External Google Maps Button */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowLiveMap(!showLiveMap)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold transition-all border"
            style={{
              background: showLiveMap ? 'var(--accent-wash)' : 'var(--bg-surface-raised)',
              borderColor: showLiveMap ? 'var(--accent)' : 'var(--border)',
              color: showLiveMap ? 'var(--accent)' : 'var(--ink-primary)',
            }}
          >
            <Icon name="mapPin" size={14} />
            <span>{showLiveMap ? 'Hide Embedded Map' : 'Show Map using Lat & Lng'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold transition-all border hover:opacity-90"
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#2563eb',
            }}
          >
            <span>Open in Maps ↗</span>
          </a>
        </div>

        {/* Coordinates Details Grid */}
        <div className="mb-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}>
            <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>Latitude</span>
            <span className="font-mono text-sm font-bold">{lat.toFixed(6)}° N</span>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}>
            <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>Longitude</span>
            <span className="font-mono text-sm font-bold">{lng.toFixed(6)}° E</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={copyCoords}>
            {copied ? '✓ Coordinates Copied' : 'Copy GPS Coordinates'}
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
