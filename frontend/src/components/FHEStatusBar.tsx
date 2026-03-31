type FHEStatusBarProps = {
  orderCount: number
}

const statuses = [
  { id: 'fhe', label: 'FHE Active' },
  { id: 'orders', label: 'Encrypted Orders' },
  { id: 'matching', label: 'Private Matching' },
] as const

export function FHEStatusBar({ orderCount }: FHEStatusBarProps) {
  return (
    <div className="status-bar">
      {statuses.map((status) => (
        <div className="status-pill" key={status.id}>
          <span className="status-dot" />
          <span>{status.label}</span>
          {status.id === 'orders' ? <strong>{orderCount}</strong> : null}
        </div>
      ))}
    </div>
  )
}
