import type { TransactionEntry } from '../hooks/useShadowSwap'

type TransactionHistoryProps = {
  contractAddress: string
  deploymentPending: boolean
  history: TransactionEntry[]
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export function TransactionHistory({
  contractAddress,
  deploymentPending,
  history,
}: TransactionHistoryProps) {
  return (
    <section className="glass-panel panel-stack">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Activity</p>
          <h2>Sealed transaction history</h2>
        </div>
        <span className={`badge ${deploymentPending ? 'badge-warning' : 'badge-success'}`}>
          {deploymentPending ? 'Contract unavailable' : 'Live contract'}
        </span>
      </div>

      <div className="deployment-strip">
        <span>Contract</span>
        <code className="mono">{contractAddress}</code>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state">No activity yet. Seal your first order to begin the trail.</div>
        ) : (
          history.map((entry) => (
            <article className="history-row" key={entry.id}>
              <div>
                <strong>{entry.action === 'submit' ? 'order sealed' : entry.action}</strong>
                <p>{entry.pair ?? 'ShadowSwap core action'}</p>
              </div>
              <div>
                <span>{entry.amount ? `${entry.amount} units` : 'Protocol call'}</span>
                <span>{formatTimestamp(entry.submittedAt)}</span>
              </div>
              <a href={`https://sepolia.arbiscan.io/tx/${entry.hash}`} rel="noreferrer" target="_blank">
                {entry.hash.slice(0, 10)}...
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
