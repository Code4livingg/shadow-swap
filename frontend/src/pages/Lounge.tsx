type LoungeProps = {
  activeClubs: number
  encryptedTrades: number
  fheOperationsToday: number
  isConnected: boolean
  recentActivity: string[]
  totalEncryptedOrders: number
}

export function Lounge({
  activeClubs,
  encryptedTrades,
  fheOperationsToday,
  isConnected,
  recentActivity,
  totalEncryptedOrders,
}: LoungeProps) {
  const stats = [
    { label: 'Total encrypted orders', value: totalEncryptedOrders },
    { label: 'Active clubs', value: activeClubs },
    { label: 'FHE operations today', value: fheOperationsToday },
    { label: 'Your encrypted trades', value: isConnected ? encryptedTrades : 0 },
  ]

  return (
    <section className="page-stack">
      <section className="glass-panel lounge-hero">
        <div className="particle-field" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">The Lounge</p>
        <h2>You are now inside ShadowSwap</h2>
        <p className="hero-copy-line">
          Your orders are encrypted. Your membership is private. Your trades are invisible.
        </p>
      </section>

      <section className="stats-grid four-up">
        {stats.map((stat) => (
          <article className="stat-card glass-panel" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="glass-panel panel-stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent encrypted activity</p>
            <h2>Private tape</h2>
          </div>
        </div>

        <div className="activity-feed">
          {recentActivity.map((entry) => (
            <article className="feed-row" key={entry}>
              <span>{entry}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
