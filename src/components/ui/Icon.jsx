const PATHS = {
  alertTriangle: 'M12 3.5 21.5 20h-19L12 3.5Z M12 9.5v4.25 M12 16.75h.01',
  clock: 'M12 12V7 M12 12l3.5 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M8 12.5l2.5 2.5L16 9.5',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.6 10.8c.6.46 1.1 1.2 1.2 2.2h4.8c.1-1 .6-1.74 1.2-2.2A6 6 0 0 0 12 3Z',
  x: 'M6 6l12 12 M18 6 6 18',
  chevronRight: 'M9 6l6 6-6 6',
  mapPin: 'M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  gauge: 'M12 13.5 15.5 10 M4 15.5a8 8 0 1 1 16 0 M4 15.5h16',
  truck: 'M3 7h10v9H3z M13 11h4l3 3v2h-7z M6.5 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z M16.5 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z M10 19a2 2 0 0 0 4 0',
  wifiOff: 'M3 3l18 18 M8.5 12.2a6 6 0 0 1 3.7-1.4 M5.3 8.9A10.5 10.5 0 0 1 12 6.5c1.6 0 3.1.3 4.5.9 M15.7 10.8a6 6 0 0 1 2.3 1.4 M12 17.5h.01',
  wifi: 'M5 9.5a10.5 10.5 0 0 1 14 0 M8 12.7a6 6 0 0 1 8 0 M12 17.5h.01',
  swap: 'M7 7h11l-3-3 M18 17H7l3 3 M4 7h.01 M20 17h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.35-4.35',
  plus: 'M12 5v14 M5 12h14',
  building: 'M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16 M14 21v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9 M8 8h.01 M8 12h.01 M8 16h.01',
}

export default function Icon({ name, size = 16, strokeWidth = 2, className = '' }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
