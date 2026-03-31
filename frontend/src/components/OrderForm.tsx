import { Lock } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { EncryptAnimation } from './EncryptAnimation'

type OrderFormProps = {
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

export function OrderForm({ deploymentPending, disabled, onSubmit, submitting }: OrderFormProps) {
  const [tokenA, setTokenA] = useState('ETH')
  const [tokenB, setTokenB] = useState('USDC')
  const [amount, setAmount] = useState('1')
  const [price, setPrice] = useState('1900')
  const [isBuy, setIsBuy] = useState(true)
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [animationActive, setAnimationActive] = useState(false)
  const [completedHash, setCompletedHash] = useState<string | null>(null)

  useEffect(() => {
    if (!animationActive || !completedHash) {
      return
    }

    const timer = window.setTimeout(() => {
      setAnimationActive(false)
      setCompletedHash(null)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [animationActive, completedHash])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAnimationActive(true)
    setCompletedHash(null)

    try {
      const hash = await onSubmit({ amount, isBuy, price, tokenA, tokenB })
      if (hash) {
        setCompletedHash(hash)
      }
    } catch {
      setAnimationActive(false)
      setCompletedHash(null)
    }
  }

  return (
    <section className="glass-panel panel-stack order-form-panel">
      <EncryptAnimation active={animationActive} completedHash={completedHash} label="FHE Order Sealing" />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Trade</p>
          <h2>Seal a new order</h2>
        </div>
        <div className="badge-row">
          <span className="badge badge-accent">Encrypted</span>
          <span className="badge badge-gold">Threshold-ready</span>
        </div>
      </div>

      <div className="encryption-strip">
        <Lock size={16} />
        <span>E2E Encrypted</span>
      </div>

      <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <div className="toggle-row" role="radiogroup" aria-label="Order type">
          <button
            className={orderType === 'limit' ? 'segmented-button active' : 'segmented-button'}
            onClick={() => setOrderType('limit')}
            type="button"
          >
            Limit
          </button>
          <button
            className={orderType === 'market' ? 'segmented-button active' : 'segmented-button'}
            onClick={() => setOrderType('market')}
            type="button"
          >
            Market
          </button>
        </div>

        <label>
          Token A
          <input onChange={(event) => setTokenA(event.target.value.toUpperCase())} value={tokenA} />
        </label>

        <label>
          Token B
          <input onChange={(event) => setTokenB(event.target.value.toUpperCase())} value={tokenB} />
        </label>

        <label>
          Amount
          <input min="1" onChange={(event) => setAmount(event.target.value)} type="number" value={amount} />
        </label>

        <label>
          Limit Price
          <input min="1" onChange={(event) => setPrice(event.target.value)} type="number" value={price} />
        </label>

        <div className="toggle-row" role="radiogroup" aria-label="Order side">
          <button
            className={isBuy ? 'segmented-button active' : 'segmented-button'}
            onClick={() => setIsBuy(true)}
            type="button"
          >
            Buy Token A
          </button>
          <button
            className={!isBuy ? 'segmented-button active sell' : 'segmented-button'}
            onClick={() => setIsBuy(false)}
            type="button"
          >
            Sell Token A
          </button>
        </div>

        <div className="submission-meta">
          <span>Pair routing: {tokenA}/{tokenB}</span>
          <span>{deploymentPending ? 'Awaiting contract deployment' : 'Arbitrum Sepolia ready'}</span>
        </div>

        {amount ? (
          <p className="micro-copy">This amount will be encrypted before submission.</p>
        ) : null}

        <button className="primary-button primary-violet wide" disabled={disabled || submitting} type="submit">
          {submitting ? (
            <span className="button-inline">
              <Lock className="spin" size={16} />
              Sealing order...
            </span>
          ) : (
            'Seal & Submit Order'
          )}
        </button>

        <p className="micro-copy">Powered by Fhenix CoFHE</p>
      </form>
    </section>
  )
}
