import Icon from './Icon'

const CONFIG = {
  good: { icon: 'checkCircle', bg: 'var(--good-wash)', fg: 'var(--good)' },
  warning: { icon: 'clock', bg: 'var(--warning-wash)', fg: 'var(--warning)' },
  serious: { icon: 'alertTriangle', bg: 'var(--serious-wash)', fg: 'var(--serious)' },
  high: { icon: 'alertTriangle', bg: '#ffe4e6', fg: '#e11d48' },
  critical: { icon: 'alertTriangle', bg: 'var(--critical-wash)', fg: 'var(--critical)' },
  hold: { icon: 'clock', bg: '#fef3c7', fg: '#b45309' },
  info: { icon: 'bulb', bg: 'var(--accent-wash)', fg: 'var(--accent)' },
  neutral: { icon: null, bg: 'transparent', fg: 'var(--ink-muted)' },
}

export default function StatusChip({ severity = 'neutral', children, icon }) {
  const cfg = CONFIG[severity] ?? CONFIG.neutral
  const iconName = icon ?? cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {iconName && <Icon name={iconName} size={12} strokeWidth={2.4} />}
      {children}
    </span>
  )
}
