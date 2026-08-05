import Card from './Card'

export default function ComingSoon({ title }) {
  return (
    <Card title={title}>
      <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
        This screen is built in a later phase of the prototype plan.
      </p>
    </Card>
  )
}
