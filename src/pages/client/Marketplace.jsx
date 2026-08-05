import { useState } from 'react'
import { catalog } from '../../data/catalog'
import { sites } from '../../data/sites'
import { useAppStore } from '../../store/appStore'
import { clientById } from '../../data/clients'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Icon from '../../components/ui/Icon'

export default function Marketplace() {
  const [filter, setFilter] = useState('All')
  const [selectedSiteId, setSelectedSiteId] = useState('S001')
  const rentFromCatalog = useAppStore((s) => s.rentFromCatalog)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const client = clientById[activeClientId]

  const clientSites = sites.filter((s) => client?.sites?.includes(s.id))
  const types = ['All', ...new Set(catalog.map((c) => c.type))]

  const filtered = filter === 'All' ? catalog : catalog.filter((c) => c.type === filter)

  const handleRent = (item) => {
    rentFromCatalog(item, selectedSiteId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            Equipment Marketplace & Dealer Catalog
          </h1>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            Browse dealer inventory, inspect machine capacities, and deploy machinery directly to active sites.
          </p>
        </div>

        {/* Target Deployment Site Selector */}
        <div className="flex items-center gap-2 rounded-xl border bg-white p-2 shadow-xs" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Deploy To Site:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="rounded bg-slate-100 px-3 py-1 font-bold text-xs text-slate-900 border-none focus:outline-none"
          >
            {clientSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === type ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <Card key={item.id} bodyClassName="flex flex-col h-full p-5 hover:border-amber-400 transition-all duration-200">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                <Icon name="truck" size={22} />
              </div>
              <StatusChip severity="good">Dealer Stock Ready</StatusChip>
            </div>

            <div className="mb-1 font-display text-base font-bold text-slate-900">
              {item.tier} {item.type}
            </div>
            <div className="text-xs text-slate-500">
              Model Ref: <span className="font-data font-semibold text-slate-700">{item.id}</span>
            </div>

            <div className="my-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-[11px] border border-slate-100">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Runtime Capacity</span>
                <span className="font-bold text-slate-800">{item.minUsageHrs}-{item.maxUsageHrs} hrs/day</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Class Rating</span>
                <span className="font-bold text-slate-800">{item.tier} Duty</span>
              </div>
            </div>

            <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rental Rate</div>
                  <div className="font-data text-lg font-extrabold text-slate-900">
                    ${item.dailyCost}<span className="text-xs font-normal text-slate-500">/day</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleRent(item)}
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none px-4 py-2 text-xs shadow-xs"
                >
                  Deploy Equipment
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
