import { useState, type FormEvent } from 'react'
import { SignalCard, type DemoSignal } from '../components/SignalCard'

type SignalsProps = {
  decryptSignal: (id: string) => Promise<void>
  decryptingId: string | null
  filter: 'all' | 'club'
  revealedIds: string[]
  setFilter: (value: 'all' | 'club') => void
  signals: readonly DemoSignal[]
  typedText: Record<string, string>
}

export function Signals({
  decryptSignal,
  decryptingId,
  filter,
  revealedIds,
  setFilter,
  signals,
  typedText,
}: SignalsProps) {
  const [open, setOpen] = useState(false)
  const [club, setClub] = useState('Shadow Alpha')
  const [signalType, setSignalType] = useState('Buy')
  const [token, setToken] = useState('ETH')
  const [target, setTarget] = useState('3200')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOpen(false)
  }

  return (
    <section className="page-stack">
      <section className="glass-panel panel-stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Signals</p>
            <h2>Encrypted Signal Feed</h2>
          </div>
          <div className="action-inline">
            <div className="toggle-row compact-row" role="radiogroup" aria-label="Signal filter">
              <button
                className={filter === 'all' ? 'segmented-button active' : 'segmented-button'}
                onClick={() => setFilter('all')}
                type="button"
              >
                All Signals
              </button>
              <button
                className={filter === 'club' ? 'segmented-button active' : 'segmented-button'}
                onClick={() => setFilter('club')}
                type="button"
              >
                Your Club Only
              </button>
            </div>

            <button className="primary-button primary-violet" onClick={() => setOpen(true)} type="button">
              Post Signal
            </button>
          </div>
        </div>

        <div className="signal-feed">
          {signals.length === 0 ? (
            <div className="empty-state">No signals yet. Seal the first signal.</div>
          ) : (
            signals.map((signal) => (
              <SignalCard
                decrypting={decryptingId === signal.id}
                key={signal.id}
                onDecrypt={(id) => {
                  void decryptSignal(id)
                }}
                revealed={revealedIds.includes(signal.id)}
                signal={signal}
                visibleText={typedText[signal.id] ?? ''}
              />
            ))
          )}
        </div>
      </section>

      {open ? (
        <div className="modal-backdrop">
          <div className="modal-card glass-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Post Signal</p>
                <h2>Seal and broadcast</h2>
              </div>
              <button className="secondary-button compact" onClick={() => setOpen(false)} type="button">
                Close
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                Club
                <select onChange={(event) => setClub(event.target.value)} value={club}>
                  <option>Shadow Alpha</option>
                  <option>Cipher Desk</option>
                  <option>Dark Liquidity</option>
                </select>
              </label>
              <label>
                Signal type
                <select onChange={(event) => setSignalType(event.target.value)} value={signalType}>
                  <option>Buy</option>
                  <option>Sell</option>
                  <option>Neutral</option>
                  <option>Analysis</option>
                </select>
              </label>
              <label>
                Token
                <input onChange={(event) => setToken(event.target.value.toUpperCase())} value={token} />
              </label>
              <label>
                Target price
                <input onChange={(event) => setTarget(event.target.value)} type="number" value={target} />
              </label>
              <p className="micro-copy">Your signal will be encrypted before leaving your browser.</p>
              <button className="primary-button primary-violet wide" type="submit">
                Seal & Broadcast
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
