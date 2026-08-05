// Equipment catalog: every type comes in two tiers so the recommendation
// engine has a cheaper alternative to match a flagged (under-used) rental against.
export const catalog = [
  { id: 'CAT-EXC-H', type: 'Excavator', tier: 'Heavy', dailyCost: 420, minUsageHrs: 5, maxUsageHrs: 10 },
  { id: 'CAT-EXC-C', type: 'Excavator', tier: 'Compact', dailyCost: 220, minUsageHrs: 1, maxUsageHrs: 4 },

  { id: 'CAT-BLD-H', type: 'Bulldozer', tier: 'Heavy', dailyCost: 480, minUsageHrs: 5, maxUsageHrs: 10 },
  { id: 'CAT-BLD-C', type: 'Bulldozer', tier: 'Compact', dailyCost: 260, minUsageHrs: 1, maxUsageHrs: 4 },

  { id: 'CAT-CRN-S', type: 'Crane', tier: 'Mobile Standard', dailyCost: 600, minUsageHrs: 4, maxUsageHrs: 8 },
  { id: 'CAT-CRN-M', type: 'Crane', tier: 'Mini', dailyCost: 310, minUsageHrs: 1, maxUsageHrs: 3 },

  { id: 'CAT-GRD-S', type: 'Grader', tier: 'Standard', dailyCost: 390, minUsageHrs: 4, maxUsageHrs: 8 },
  { id: 'CAT-GRD-C', type: 'Grader', tier: 'Compact', dailyCost: 210, minUsageHrs: 1, maxUsageHrs: 3 },

  { id: 'CAT-FRK-H', type: 'Forklift', tier: 'Heavy Duty', dailyCost: 280, minUsageHrs: 4, maxUsageHrs: 9 },
  { id: 'CAT-FRK-S', type: 'Forklift', tier: 'Standard', dailyCost: 150, minUsageHrs: 1, maxUsageHrs: 3 },

  { id: 'CAT-LDR-W', type: 'Loader', tier: 'Wheel', dailyCost: 350, minUsageHrs: 4, maxUsageHrs: 9 },
  { id: 'CAT-LDR-C', type: 'Loader', tier: 'Compact', dailyCost: 190, minUsageHrs: 1, maxUsageHrs: 3 },

  { id: 'CAT-RLR-T', type: 'Roller', tier: 'Tandem', dailyCost: 300, minUsageHrs: 4, maxUsageHrs: 8 },
  { id: 'CAT-RLR-S', type: 'Roller', tier: 'Single Drum', dailyCost: 170, minUsageHrs: 1, maxUsageHrs: 3 },
]

export const catalogById = Object.fromEntries(catalog.map((c) => [c.id, c]))

export function catalogFor(type) {
  return catalog.filter((c) => c.type === type)
}
