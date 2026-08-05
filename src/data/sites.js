export const sites = [
  { id: 'S001', name: 'North Yard', region: 'Metro North' },
  { id: 'S002', name: 'Riverside Site', region: 'Metro East' },
  { id: 'S003', name: 'Hillside Quarry', region: 'Highlands' },
  { id: 'S004', name: 'East Depot', region: 'Metro East' },
  { id: 'S005', name: 'Central Plant', region: 'Metro Central' },
  { id: 'S006', name: 'Lakeside Project', region: 'Highlands' },
  { id: 'S007', name: 'Westgate Expansion', region: 'Metro West' },
  { id: 'S008', name: 'Harbour Terminal', region: 'Coastal' },
  { id: 'S009', name: 'Ridgeline Tunnel', region: 'Highlands' },
  { id: 'S010', name: 'Southfield Logistics', region: 'Metro South' },
  { id: 'S011', name: 'Airport Runway Ph2', region: 'Metro West' },
  { id: 'S012', name: 'Granite Ridge Mine', region: 'Highlands' },
]

export const siteById = Object.fromEntries(sites.map((s) => [s.id, s]))
