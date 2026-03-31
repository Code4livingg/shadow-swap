import { OrderForm } from '../components/OrderForm'

type TradeProps = {
  deploymentPending: boolean
  disabled: boolean
  onSubmit: (values: {
    amount: string
    isBuy: boolean
    price: string
    tokenA: string
    tokenB: string
  }) => Promise<string | void>
  submitting: boolean
}

export function Trade({ deploymentPending, disabled, onSubmit, submitting }: TradeProps) {
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
          deploymentPending={deploymentPending}
          disabled={disabled}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </section>
    </section>
  )
}
