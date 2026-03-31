import { Lock } from 'lucide-react'

export type DemoSignal = {
  club: string
  encryptedBody: string
  id: string
  revealedBody: string
  timestamp: string
}

type SignalCardProps = {
  decrypting: boolean
  revealed: boolean
  signal: DemoSignal
  visibleText: string
  onDecrypt: (id: string) => void
}

export function SignalCard({
  decrypting,
  revealed,
  signal,
  visibleText,
  onDecrypt,
}: SignalCardProps) {
  return (
    <article className="signal-card glass-panel">
      <div className="panel-heading">
        <div>
          <p className="mono">Signal #{signal.id}</p>
          <span className="badge badge-muted">{signal.club}</span>
        </div>
        <span className="badge badge-gold">FHE Sealed</span>
      </div>

      <div className={`signal-body ${revealed ? 'revealed' : ''}`}>
        <p className={revealed ? 'typewriter-output' : 'encrypted-blocks'}>
          {revealed ? visibleText : signal.encryptedBody}
        </p>
        <span className="muted-line">
          {revealed ? 'Decrypted with threshold key.' : 'Decrypt with club key to reveal'}
        </span>
      </div>

      <div className="signal-footer">
        <span className="muted-line">{signal.timestamp}</span>
        <button className="secondary-button" disabled={decrypting || revealed} onClick={() => onDecrypt(signal.id)} type="button">
          {decrypting ? (
            <span className="button-inline">
              <Lock className="spin" size={16} />
              Decrypting...
            </span>
          ) : revealed ? (
            'Decrypted'
          ) : (
            'Decrypt Signal'
          )}
        </button>
      </div>
    </article>
  )
}
