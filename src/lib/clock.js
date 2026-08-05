// Central "current date" for the whole demo. The dataset is written around
// this date so overdue / due-soon / anomaly states are true out of the box.
// The Zustand clock store (added in the polish pass) lets the demo advance
// this date live without touching any of the seed data.
export const SIM_TODAY = new Date('2026-08-05T09:00:00')
