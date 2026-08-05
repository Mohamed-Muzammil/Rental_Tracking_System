export const clients = [
  { id: 'C001', name: 'Vertex Builders Ltd', contact: 'Priya Nair', sites: ['S001', 'S002'] },
  { id: 'C002', name: 'Summit Mining Co.', contact: 'Daniel Ortiz', sites: ['S003', 'S012'] },
  { id: 'C003', name: 'Coastal Infrastructure Pvt Ltd', contact: 'Wei Lin', sites: ['S002', 'S008'] },
  { id: 'C004', name: 'Ironvale Constructions', contact: 'Aisha Rahman', sites: ['S005', 'S007'] },
  { id: 'C005', name: 'Northline Civil Works', contact: 'Tomas Berg', sites: ['S001', 'S011'] },
  { id: 'C006', name: 'Blue Harbour Logistics', contact: 'Sofia Marchetti', sites: ['S008', 'S010'] },
  { id: 'C007', name: 'Redstone Aggregates', contact: 'Marcus Bell', sites: ['S003', 'S006'] },
  { id: 'C008', name: 'Apex Tunnelling Group', contact: 'Hana Kobayashi', sites: ['S009'] },
]

export const clientById = Object.fromEntries(clients.map((c) => [c.id, c]))
