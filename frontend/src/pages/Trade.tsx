import { MatchPanel } from '../components/MatchPanel'
import { OrderForm } from '../components/OrderForm'
import { useMatches } from '../hooks/useMatches'

type TradeProps = {
  blindSubmitting: boolean
  deploymentPending: boolean
  disabled: boolean
  onSubmitBlind: (values: {
    amount: string
    slippage: string
    tokenA: string
    tokenB: string
  }) => Promise<string | void>
  onSubmit: (values: {
    amount: string
    isBuy: boolean
    price: string
    tokenA: string
    tokenB: string
  }) => Promise<string | void>
  submitting: boolean
}

export function Trade({
  blindSubmitting,
  deploymentPending,
  disabled,
  onSubmitBlind,
  onSubmit,
  submitting,
}: TradeProps) {
  const matches = useMatches()

  return (
    <section className="page-stack">
      <section className="split-grid">
        <article className="glass-panel trade-copy">
          <p className="eyebrow">Trade</p>
          <h2>Your order never touches plaintext.</h2>
          <p className="hero-copy-line">
            Encrypted in your browser. Matched on ciphertext. Revealed only to you.
          </p>
          <div className="feature-ribbon">
            <span>Browser-side encryption</span>
            <span>FHE matching</span>
            <span>Selective reveal</span>
          </div>
        </article>

        <OrderForm
          blindSubmitting={blindSubmitting}
          deploymentPending={deploymentPending}
          disabled={disabled}
          onSubmitBlind={onSubmitBlind}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </section>

      <MatchPanel error={matches.error} loading={matches.loading} matches={matches.matches} />
    </section>
  )
}
