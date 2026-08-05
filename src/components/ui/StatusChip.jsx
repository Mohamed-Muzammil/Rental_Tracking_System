import Icon from './Icon'

const CONFIG = {
  good:     { bg: 'var(--good-wash)',     fg: 'var(--good)',     icon: 'checkCircle' },
  warning:  { bg: 'var(--warning-wash)',  fg: 'var(--warning)',  icon: 'clock' },
  serious:  { bg: 'var(--serious-wash)',  fg: 'var(--serious)',  icon: 'alertTriangle' },
  high:     { bg: 'var(--critical-wash)', fg: 'var(--critical)', icon: 'alertTriangle' },
  critical: { bg: 'var(--critical-wash)', fg: 'var(--critical)', icon: 'alertTriangle' },
  hold:     { bg: 'var(--warning-wash)',  fg: 'var(--warning)',  icon: 'clock' },
  info:     { bg: 'var(--accent-wash)',   fg: 'var(--accent)',   icon: 'bulb' },
  neutral:  { bg: 'var(--bg-surface-raised)', fg: 'var(--ink-muted)', icon: null },
  medium:   { bg: 'var(--warning-wash)',  fg: 'var(--warning)',  icon: 'clock' },
}

export default function StatusChip({ severity = 'neutral', children, icon }) {
  const cfg = CONFIG[severity] ?? CONFIG.neutral
  const iconName = icon ?? cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap"
      style={{
        background: cfg.bg,
        color: cfg.fg,
        borderRadius: '4px',
      }}
    >
      {iconName && <Icon name={iconName} size={10} strokeWidth={2.5} />}
      {children}
    </span>
  )
}
