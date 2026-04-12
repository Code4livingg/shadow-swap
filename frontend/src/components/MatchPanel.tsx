import type { IntentMatch } from '../contracts/ShadowSwap'

type MatchPanelProps = {
  error: string | null
  loading: boolean
  matches: IntentMatch[]
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(Number(value) * 1000))

export function MatchPanel({ error, loading, matches }: MatchPanelProps) {
  return (
    <section className="glass-panel panel-stack">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Blind Matches</p>
          <h2>Matched intent pairs</h2>
        </div>
        <span className="badge badge-gold">{loading ? 'Refreshing' : `${matches.length} matches`}</span>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="history-list">
        {matches.length === 0 ? (
          <div className="empty-state">
            {loading ? 'Loading blind matches...' : 'No blind intent matches recorded yet.'}
          </div>
        ) : (
          matches.map((match) => (
            <article className="history-row" key={match.id}>
              <div>
                <strong>🔒 Private Match</strong>
                <p>Intent A: {match.intentA}</p>
                <p>Intent B: {match.intentB}</p>
                <p>Matched using blind intent protocol</p>
              </div>
              <div>
                <span>Blind intent pair</span>
                <span>{formatTimestamp(match.timestamp)}</span>
              </div>
              <code className="mono">{match.timestamp}</code>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
