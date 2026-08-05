export const clients = [
  {
    id: 'C001', name: 'Vertex Builders Ltd', contact: 'Priya Nair', sites: ['S001', 'S002'],
    description: 'Vertex Builders specializes in high-rise commercial developments across the metro area. They have been a primary partner since 2018.',
    overdueAmount: 0, fineAmount: 0,
    billingHistory: [
      { id: 'INV-101', date: '2026-07-01', amount: 15400, status: 'paid' },
      { id: 'INV-102', date: '2026-08-01', amount: 24500, status: 'paid' }
    ]
  },
  {
    id: 'C002', name: 'Summit Mining Co.', contact: 'Daniel Ortiz', sites: ['S003', 'S012'],
    description: 'Summit Mining Co. operates large-scale open-pit excavations. They require heavy-duty, high-availability machinery.',
    overdueAmount: 12500, fineAmount: 450,
    billingHistory: [
      { id: 'INV-103', date: '2026-06-15', amount: 48000, status: 'paid' },
      { id: 'INV-104', date: '2026-07-15', amount: 12500, status: 'overdue' }
    ]
  },
  {
    id: 'C003', name: 'Coastal Infrastructure Pvt Ltd', contact: 'Wei Lin', sites: ['S002', 'S008'],
    description: 'A civil engineering firm focused on coastal defenses, bridge reinforcement, and port expansion projects.',
    overdueAmount: 0, fineAmount: 0,
    billingHistory: [
      { id: 'INV-105', date: '2026-07-10', amount: 32000, status: 'paid' }
    ]
  },
  {
    id: 'C004', name: 'Ironvale Constructions', contact: 'Aisha Rahman', sites: ['S005', 'S007'],
    description: 'Ironvale handles suburban residential tract development and smaller municipal paving contracts.',
    overdueAmount: 0, fineAmount: 0,
    billingHistory: [
      { id: 'INV-106', date: '2026-07-01', amount: 9800, status: 'paid' },
      { id: 'INV-107', date: '2026-08-01', amount: 11200, status: 'paid' }
    ]
  },
  {
    id: 'C005', name: 'Northline Civil Works', contact: 'Tomas Berg', sites: ['S001', 'S011'],
    description: 'Northline specializes in highway maintenance and emergency road repairs. Their fleet usage is highly variable.',
    overdueAmount: 4500, fineAmount: 0,
    billingHistory: [
      { id: 'INV-108', date: '2026-06-05', amount: 22000, status: 'paid' },
      { id: 'INV-109', date: '2026-07-05', amount: 4500, status: 'overdue' }
    ]
  },
  {
    id: 'C006', name: 'Blue Harbour Logistics', contact: 'Sofia Marchetti', sites: ['S008', 'S010'],
    description: 'Blue Harbour operates large distribution warehouses and utilizes a high volume of forklifts and material handlers.',
    overdueAmount: 0, fineAmount: 0,
    billingHistory: [
      { id: 'INV-110', date: '2026-07-20', amount: 18500, status: 'paid' }
    ]
  },
  {
    id: 'C007', name: 'Redstone Aggregates', contact: 'Marcus Bell', sites: ['S003', 'S006'],
    description: 'Redstone supplies raw materials and aggregates. They heavily use loaders and dumpers for quarry operations.',
    overdueAmount: 0, fineAmount: 850,
    billingHistory: [
      { id: 'INV-111', date: '2026-07-28', amount: 34000, status: 'paid' }
    ]
  },
  {
    id: 'C008', name: 'Apex Tunnelling Group', contact: 'Hana Kobayashi', sites: ['S009'],
    description: 'Apex focuses on deep underground tunneling and subway expansions. High-risk, high-margin projects.',
    overdueAmount: 0, fineAmount: 0,
    billingHistory: [
      { id: 'INV-112', date: '2026-07-01', amount: 120000, status: 'paid' }
    ]
  },
  {
    id: 'C009', name: 'Meridian Earthworks', contact: 'Lucas Ferreira', sites: ['S004', 'S007'],
    description: 'Expanded network of regional earthworks.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C010', name: 'Granite Peak Contractors', contact: 'Emily Novak', sites: ['S012', 'S006'],
    description: 'General contractors.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C011', name: 'Cascade Infrastructure Group', contact: 'Noah Kim', sites: ['S010', 'S008'],
    description: 'Infrastructure development.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C012', name: 'Union Bay Logistics', contact: 'Grace Adeyemi', sites: ['S008'],
    description: 'Logistics and supply chain.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C013', name: 'Highland Quarry Partners', contact: 'Ivan Petrov', sites: ['S003', 'S009'],
    description: 'Quarry and mining operations.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C014', name: 'Sterling Civil Contractors', contact: 'Maya Desai', sites: ['S005'],
    description: 'Civil works and contractors.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C015', name: 'Blackrock Aggregates', contact: 'Owen Fitzgerald', sites: ['S006', 'S012'],
    description: 'Aggregate supply.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C016', name: 'Delta Port Works', contact: 'Camila Rossi', sites: ['S008', 'S002'],
    description: 'Port and marine works.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C017', name: 'Foundry Lane Builders', contact: 'Ethan Walsh', sites: ['S001', 'S004'],
    description: 'Commercial builders.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C018', name: 'Pioneer Site Services', contact: 'Amara Okafor', sites: ['S011', 'S007'],
    description: 'Site management services.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C019', name: 'Anchor Point Logistics', contact: 'Felix Nguyen', sites: ['S010'],
    description: 'Logistics handling.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  },
  {
    id: 'C020', name: 'Continental Earthmoving', contact: 'Sana Malik', sites: ['S009', 'S003'],
    description: 'Earthmoving operations.', overdueAmount: 0, fineAmount: 0, billingHistory: []
  }
]

export const clientById = Object.fromEntries(clients.map((c) => [c.id, c]))
