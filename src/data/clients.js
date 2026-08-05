export const clients = [
  { id: 'C001', name: 'Vertex Builders Ltd', contact: 'Priya Nair', sites: ['S001', 'S002'] },
  { id: 'C002', name: 'Summit Mining Co.', contact: 'Daniel Ortiz', sites: ['S001', 'S003'] },
  { id: 'C003', name: 'Coastal Infrastructure Pvt Ltd', contact: 'Wei Lin', sites: ['S002', 'S003'] },
]

export const clientById = Object.fromEntries(clients.map((c) => [c.id, c]))
