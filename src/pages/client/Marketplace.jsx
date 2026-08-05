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
        <div
          className="flex items-center gap-2 border p-2"
          style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Deploy To Site:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="rounded-[var(--radius-sm)] border-none px-3 py-1 font-bold text-xs outline-none"
            style={{ background: 'var(--bg-surface-raised)', color: 'var(--ink-primary)' }}
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
            className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold transition-all"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: filter === type ? 'var(--ink-primary)' : 'var(--bg-surface-raised)',
              color: filter === type ? '#ffffff' : 'var(--ink-secondary)',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <Card key={item.id} bodyClassName="flex flex-col h-full p-5 transition-all duration-200">
            <div className="mb-3 flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center font-bold border"
                style={{ borderRadius: 'var(--radius-md)', background: 'var(--warning-wash)', color: 'var(--warning)', borderColor: 'var(--border)' }}
              >
                <Icon name="truck" size={22} />
              </div>
              <StatusChip severity="good">Dealer Stock Ready</StatusChip>
            </div>

            <div className="mb-1 font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
              {item.tier} {item.type}
            </div>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Model Ref: <span className="font-data font-semibold" style={{ color: 'var(--ink-secondary)' }}>{item.id}</span>
            </div>

            <div
              className="my-4 grid grid-cols-2 gap-2 p-2.5 text-[11px] border"
              style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
            >
              <div>
                <span className="block font-semibold uppercase text-[9px]" style={{ color: 'var(--ink-faint)' }}>Runtime Capacity</span>
                <span className="font-bold" style={{ color: 'var(--ink-primary)' }}>{item.minUsageHrs}-{item.maxUsageHrs} hrs/day</span>
              </div>
              <div>
                <span className="block font-semibold uppercase text-[9px]" style={{ color: 'var(--ink-faint)' }}>Class Rating</span>
                <span className="font-bold" style={{ color: 'var(--ink-primary)' }}>{item.tier} Duty</span>
              </div>
            </div>

            <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>Rental Rate</div>
                  <div className="font-data text-lg font-extrabold" style={{ color: 'var(--ink-primary)' }}>
                    ${item.dailyCost}<span className="text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>/day</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleRent(item)}
                  variant="primary"
                  className="font-bold px-4 py-2 text-xs"
                  style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}
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
