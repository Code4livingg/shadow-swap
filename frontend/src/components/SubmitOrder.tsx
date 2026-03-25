import { useState } from 'react'
import type { FormEvent } from 'react'

export type SubmitOrderValues = {
  price: number
  amount: number
  isBuy: boolean
}

type SubmitOrderProps = {
  disabled: boolean
  submitting: boolean
  onSubmit: (values: SubmitOrderValues) => Promise<void>
}

export function SubmitOrder({ disabled, submitting, onSubmit }: SubmitOrderProps) {
  const [price, setPrice] = useState('100')
  const [amount, setAmount] = useState('1')
  const [isBuy, setIsBuy] = useState(true)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onSubmit({
      price: Number(price),
      amount: Number(amount),
      isBuy,
    })
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Submit Order</p>
          <h2>Encrypted order entry</h2>
        </div>
        <span className="badge">{isBuy ? 'Buy' : 'Sell'}</span>
      </div>

      <form className="order-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Price
          <input
            min="0"
            name="price"
            step="1"
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>

        <label>
          Amount
          <input
            min="0"
            name="amount"
            step="1"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <div className="toggle-row" role="radiogroup" aria-label="Order side">
          <button
            className={isBuy ? 'segmented-button active' : 'segmented-button'}
            type="button"
            onClick={() => setIsBuy(true)}
          >
            Buy
          </button>
          <button
            className={!isBuy ? 'segmented-button active' : 'segmented-button'}
            type="button"
            onClick={() => setIsBuy(false)}
          >
            Sell
          </button>
        </div>

        <button className="primary-button" disabled={disabled || submitting} type="submit">
          {submitting ? 'Encrypting...' : 'Encrypt and Submit'}
        </button>
      </form>
    </section>
  )
}
