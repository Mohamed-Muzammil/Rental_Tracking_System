import { useState } from 'react'
import { catalog } from '../../data/catalog'
import { useAppStore } from '../../store/appStore'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Card from '../ui/Card'

export default function RecommendationModal({ eq, currentUtil, onClose }) {
  const [isSent, setIsSent] = useState(false)
  const pushToast = useAppStore((s) => s.pushToast)

  // Current utilization
  const isOverUtilized = currentUtil > 0.85
  const isUnderUtilized = currentUtil < 0.3

  // Simple heuristic to suggest a different tier based on utilization
  let suggestions = catalog.filter(c => {
    if (c.type !== eq.type) return false
    if (c.id === eq.catalogId) return false
    
    const currentCat = catalog.find(x => x.id === eq.catalogId)
    const currentCost = currentCat?.dailyCost || 0
    
    if (isOverUtilized) {
      if (c.dailyCost <= currentCost) return false
      
      // Suggest upgrade only if new machine can maintain below 80% utilization
      if (currentCat && c.maxUsageHrs) {
        const capacityRatio = currentCat.maxUsageHrs / c.maxUsageHrs
        const newEngineHours = eq.avgEngineHoursPerDay * capacityRatio
        const totalTime = eq.avgEngineHoursPerDay + eq.avgIdleHoursPerDay
        const newUtil = totalTime > 0 ? (newEngineHours / totalTime) : 0
        
        if (newUtil >= 0.80) return false
      }
      return true
    }
    
    if (isUnderUtilized) return c.dailyCost < currentCost
    return false
  })

  // If under-utilized and no cheaper vehicle of the SAME type exists, suggest generally cheap alternatives
  if (isUnderUtilized && suggestions.length === 0) {
    const currentCost = catalog.find(x => x.id === eq.catalogId)?.dailyCost || 0
    const cheaperOthers = catalog.filter(c => c.dailyCost < currentCost)
    if (cheaperOthers.length > 0) {
      suggestions = cheaperOthers.sort((a, b) => a.dailyCost - b.dailyCost)
    } else {
      // If it's literally the absolute cheapest item, suggest the next cheapest things anyway
      suggestions = catalog.filter(c => c.id !== eq.catalogId).sort((a, b) => a.dailyCost - b.dailyCost)
    }
  }

  suggestions = suggestions.slice(0, 2)

  const handleSendProposal = (suggestion) => {
    setIsSent(true)
    pushToast(`Upgrade/Downgrade proposal sent to client for ${suggestion.tier} ${suggestion.type}.`, 'good')
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <Card bodyClassName="w-full max-w-lg p-6 relative flex flex-col gap-4">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-muted)' }}
        >
          <Icon name="x" size={16} />
        </button>

        <div>
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
            Utilization Action Required
          </h2>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Unit <strong>{eq.id}</strong> ({eq.tier} {eq.type}) is currently {isOverUtilized ? 'over-utilized' : 'under-utilized'} at {Math.round(currentUtil * 100)}%.
          </p>
        </div>

        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
          <p className="mb-3 font-semibold" style={{ color: 'var(--ink-primary)' }}>
            {isOverUtilized ? 'Suggested Upgrade Options:' : 'Suggested Downgrade Options (Save Cost):'}
          </p>
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {suggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{s.tier} {s.type}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>${s.dailyCost}/day (Catalog: {s.id})</div>
                  </div>
                  <Button variant="secondary" onClick={() => handleSendProposal(s)} disabled={isSent}>
                    Send Proposal
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>No alternative catalog items found for this equipment type.</p>
          )}
        </div>

        {isSent && (
          <div className="text-center text-xs font-bold" style={{ color: 'var(--good)' }}>
            Proposal successfully sent to client!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  )
}
