// Each site carries a centre point and a working radius so a telemetry ping
// can be tested against its assigned site boundary (geofencing).
export const sites = [
  { id: 'ANNA-NAGAR', name: 'Anna Nagar Metro Hub', locationName: 'Anna Nagar', city: 'Chennai', region: 'Chennai North', lat: 13.0850, lng: 80.2101, radiusKm: 2.5, description: 'Commercial infrastructure development in Anna Nagar West.' },
  { id: 'TAMBARAM', name: 'Tambaram Railway Yard', locationName: 'Tambaram', city: 'Chennai', region: 'Chennai South', lat: 12.9249, lng: 80.1000, radiusKm: 3.0, description: 'Transit hub expansion and heavy machine storage at Tambaram.' },
  { id: 'GUINDY', name: 'Guindy Industrial Estate', locationName: 'Guindy', city: 'Chennai', region: 'Chennai Central', lat: 13.0067, lng: 80.2020, radiusKm: 2.0, description: 'Core manufacturing and machinery dispatch depot in Guindy.' },
  { id: 'VELACHERY', name: 'Velachery Flyover Site', locationName: 'Velachery', city: 'Chennai', region: 'Chennai South', lat: 12.9759, lng: 80.2212, radiusKm: 1.5, description: 'Stormwater drain and road elevation project in Velachery.' },
  { id: 'ADYAR', name: 'Adyar Riverfront Site', locationName: 'Adyar', city: 'Chennai', region: 'Chennai South', lat: 13.0012, lng: 80.2565, radiusKm: 2.0, description: 'Erosion control and bridge construction along Adyar riverbank.' },
  { id: 'MYLAPORE', name: 'Mylapore Heritage Zone', locationName: 'Mylapore', city: 'Chennai', region: 'Chennai Central', lat: 13.0368, lng: 80.2676, radiusKm: 1.5, description: 'Urban renewal and subway line boring project at Mylapore.' },
  { id: 'PORUR', name: 'Porur Junction Site', locationName: 'Porur', city: 'Chennai', region: 'Chennai West', lat: 13.0382, lng: 80.1565, radiusKm: 2.5, description: 'Grade separator and highway expansion project at Porur.' },
  { id: 'AMBATTUR', name: 'Ambattur Industrial Estate', locationName: 'Ambattur', city: 'Chennai', region: 'Chennai North', lat: 13.1143, lng: 80.1548, radiusKm: 4.0, description: 'Heavy earthmoving and factory construction in Ambattur.' },
  { id: 'OMR-THORAIPAKKAM', name: 'OMR IT Corridor Hub', locationName: 'Thoraipakkam (OMR)', city: 'Chennai', region: 'Chennai South', lat: 12.9392, lng: 80.2351, radiusKm: 3.5, description: 'IT park infrastructure and elevated expressway work on OMR.' },
  { id: 'ENNORE', name: 'Ennore Port Dockyard', locationName: 'Ennore', city: 'Chennai', region: 'Chennai North', lat: 13.2215, lng: 80.3242, radiusKm: 4.0, description: 'Deep-water docking area and marine heavy equipment storage.' },
  { id: 'MEENAMBAKKAM', name: 'Airport Expansion Ph2', locationName: 'Meenambakkam', city: 'Chennai', region: 'Chennai South', lat: 12.9941, lng: 80.1709, radiusKm: 3.0, description: 'Secondary runway lighting and terminal expansion work at Meenambakkam.' },
  { id: 'CHENNAI-CENTRAL', name: 'Central Transit Depot', locationName: 'Central Station', city: 'Chennai', region: 'Chennai Central', lat: 13.0827, lng: 80.2707, radiusKm: 2.0, description: 'Central station multi-modal transit logistics yard.' },
]

export const siteById = Object.fromEntries(
  sites.flatMap((s) => [
    [s.id, s],
    // Map legacy site IDs (S001-S012) to Chennai places for complete backwards compatibility
    [`S0${String(sites.indexOf(s) + 1).padStart(2, '0')}`, s]
  ])
)


