import Icon from './Icon'

const CONFIG = {
  good:     { bg: '#dcfce7', fg: '#15803d', icon: 'checkCircle' },
  warning:  { bg: '#fef3c7', fg: '#b45309', icon: 'clock' },
  serious:  { bg: '#ffedd5', fg: '#c2410c', icon: 'alertTriangle' },
  high:     { bg: '#fee2e2', fg: '#b91c1c', icon: 'alertTriangle' },
  critical: { bg: '#fee2e2', fg: '#b91c1c', icon: 'alertTriangle' },
  hold:     { bg: '#fef3c7', fg: '#b45309', icon: 'clock' },
  info:     { bg: '#eff6ff', fg: '#1d4ed8', icon: 'bulb' },
  neutral:  { bg: '#f3f4f6', fg: '#6b7280', icon: null },
  medium:   { bg: '#fef3c7', fg: '#b45309', icon: 'clock' },
}

export default function StatusChip({ severity = 'neutral', children, icon }) {
  const cfg = CONFIG[severity] ?? CONFIG.neutral
  const iconName = icon ?? cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {iconName && <Icon name={iconName} size={10} strokeWidth={2.5} />}
      {children}
    </span>
  )
}
