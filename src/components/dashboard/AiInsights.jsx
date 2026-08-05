import { useMemo } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Link } from 'react-router-dom'
import { mlSummaries } from '../../lib/mlForecast'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { utilizationOf, recommendationFor, UNDERUTILIZED_THRESHOLD } from '../../lib/rules'
import Icon from '../ui/Icon'

function InsightCard({ icon, label, headline, detail, to, actionLabel }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}
        >
          <Icon name={icon} size={15} />
        </span>
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
          {label}
        </span>
      </div>
      <div className="text-sm font-medium leading-snug" style={{ color: 'var(--ink-primary)' }}>
        {headline}
      </div>
      <div className="text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
        {detail}
      </div>
      {to && (
        <Link to={to} className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
          {actionLabel} <Icon name="chevronRight" size={12} />
        </Link>
      )}
    </div>
  )
}

export default function AiInsights({ active, today, categories }) {
  const insights = useMemo(() => {
    // 1. Demand forecast — same XGBoost output the Forecasting page charts, so
    // the two views can never disagree. Biggest projected rise vs recent trend.
    const demand = [...mlSummaries()].sort((a, b) => b.delta - a.delta)[0]

    // 2. Idle detection — worst-utilization unit on rent, with recoverable spend.
    const idleUnits = active
      .filter((e) => utilizationOf(e) < UNDERUTILIZED_THRESHOLD)
      .sort((a, b) => utilizationOf(a) - utilizationOf(b))
    const worst = idleUnits[0]
    const worstUtil = worst ? Math.round(utilizationOf(worst) * 100) : 0
    const worstDays = worst ? Math.max(1, differenceInCalendarDays(today, new Date(worst.checkIn))) : 0
    const worstRec = worst ? recommendationFor(worst) : null
    const recoverable = worst && worstRec ? worstRec.dailySavings * worstDays : worst ? (catalogById[worst.catalogId]?.dailyCost ?? 0) * worstDays : 0

    // 3. Relocation — an idle unit whose category is also scarce in the yard.
    // Only claim the scarcity link when the idle unit is actually of that type.
    const scarce = [...categories].sort((a, b) => a.availPct - b.availPct)[0]
    const sameType = idleUnits.find((e) => e.type === scarce?.type)
    const relocatable = sameType ?? idleUnits[0]
    const scarcityMatches = Boolean(sameType)
    const relocSite = relocatable?.siteId ? siteById[relocatable.siteId]?.name : 'an unassigned site'

    return {
      demand, worst, worstUtil, worstDays, recoverable,
      scarce, relocatable, relocSite, scarcityMatches, idleCount: idleUnits.length,
    }
  }, [active, today, categories])

  const { demand, worst, worstUtil, worstDays, recoverable, scarce, relocatable, relocSite, scarcityMatches, idleCount } = insights

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--accent-wash)', borderColor: 'var(--border)' }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-secondary)' }}>
          AI Insights
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Demand from a trained XGBoost model · idle &amp; relocation from usage rules
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InsightCard
          icon="chevronRight"
          label="Demand Forecast"
          headline={
            demand && demand.delta > 0
              ? `${demand.type} demand up ${demand.delta} next month`
              : 'Demand steady across all categories'
          }
          detail={
            demand && demand.delta > 0
              ? `Model projects ${demand.nextForecast} rentals vs a ${demand.baseline.toFixed(1)} recent monthly average. Pre-position units before the peak.`
              : 'No category is projected to move more than a unit or two next month.'
          }
          to="/admin/forecasting"
          actionLabel="View forecast"
        />

        <InsightCard
          icon="bulb"
          label="Idle Equipment Detected"
          headline={
            worst
              ? `${worst.id} sitting at ${worstUtil}% utilization`
              : 'No idle equipment detected'
          }
          detail={
            worst
              ? `${worst.tier} ${worst.type} idle ${worst.avgIdleHoursPerDay}h/day for ${worstDays} days. Est. $${recoverable.toLocaleString()} recoverable by rightsizing.`
              : 'Every unit on rent is above the 30% utilization threshold.'
          }
          to="/admin/alerts"
          actionLabel="Review suggestions"
        />

        <InsightCard
          icon="mapPin"
          label="Relocation Recommendation"
          headline={
            relocatable && scarce
              ? `Move ${relocatable.id} out of ${relocSite}`
              : 'Fleet distribution looks balanced'
          }
          detail={
            !relocatable || !scarce
              ? 'No category is scarce enough to justify moving equipment between sites.'
              : scarcityMatches
                ? `${scarce.type} stock is down to ${scarce.availPct}% available while this unit sits idle at ${relocSite}. Recovering it frees a ${scarce.type} to re-rent.`
                : `${idleCount} unit${idleCount === 1 ? '' : 's'} idle across active sites. Recovering this ${relocatable.type} frees stock to re-rent.`
          }
          to="/admin/companies"
          actionLabel="View by company"
        />
      </div>
    </div>
  )
}
