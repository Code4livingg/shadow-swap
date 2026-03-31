import { Lock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { OrderbookRow, ShadowSwapSnapshot } from '../contracts/ShadowSwap'

type MarketPanelsProps = {
  onMatchOrders: () => Promise<string | void>
  onRefresh: () => Promise<void>
  onRevealWinner: () => Promise<string | void>
  orderbook: OrderbookRow[]
  refreshing: boolean
  snapshot: ShadowSwapSnapshot
  transaction: {
    hash: string | null
    stage: 'awaiting-signature' | 'confirmed' | 'error' | 'idle' | 'pending'
    summary: string
  }
  working: boolean
}

const revealLabel = (snapshot: ShadowSwapSnapshot) =>
  `Trader ${snapshot.revealedWinnerTrader} · ${snapshot.revealedWinnerIsBuy ? 'BUY' : 'SELL'} · Price ${snapshot.revealedWinnerPrice} · Amount ${snapshot.revealedWinnerAmount}`

export function MarketPanels({
  onMatchOrders,
  onRefresh,
  onRevealWinner,
  orderbook,
  refreshing,
  snapshot,
  transaction,
  working,
}: MarketPanelsProps) {
  const [decryptingWinner, setDecryptingWinner] = useState(false)
  const [visibleWinner, setVisibleWinner] = useState('')

  const winnerText = useMemo(() => {
    if (!snapshot.winnerRevealed) {
      return ''
    }

    return revealLabel(snapshot)
  }, [snapshot])

  useEffect(() => {
    if (!winnerText) {
      return
    }

    let current = 0
    const timer = window.setInterval(() => {
      current += 1
      setVisibleWinner(winnerText.slice(0, current))

      if (current >= winnerText.length) {
        window.clearInterval(timer)
        setDecryptingWinner(false)
      }
    }, 45)

    return () => window.clearInterval(timer)
  }, [winnerText])

  return (
    <>
      <section className="glass-panel panel-stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Orderbook</p>
            <h2>Encrypted market surface</h2>
          </div>
          <button className="secondary-button" disabled={refreshing} onClick={() => void onRefresh()} type="button">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span>Total sealed orders</span>
            <strong>{snapshot.orderCount}</strong>
          </article>
          <article className="stat-card">
            <span>Threshold key requested</span>
            <strong>{snapshot.winnerDecryptRequested ? 'Yes' : 'No'}</strong>
          </article>
          <article className="stat-card">
            <span>Winner decrypted</span>
            <strong>{snapshot.winnerRevealed ? 'Yes' : 'No'}</strong>
          </article>
        </div>

        <div className="book-list">
          {orderbook.map((row) => (
            <article className={`book-row ${row.side}`} key={row.id}>
              <div>
                <p>{row.label}</p>
                <span>{row.side === 'winner' ? 'Ciphertext winner candidate' : 'Encrypted level'}</span>
              </div>
              <div className="book-metrics">
                <span className="encrypted-blocks" title={row.priceHandle}>
                  ████████████████
                </span>
                <span className="encrypted-blocks" title={row.amountHandle}>
                  ████████████████
                </span>
              </div>
            </article>
          ))}

          {orderbook.length === 0 ? (
            <div className="empty-state">No orders yet. Be the first to trade in the dark.</div>
          ) : null}
        </div>
      </section>

      <section className="glass-panel panel-stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Private Matching</p>
            <h2>Match on ciphertext, decrypt with threshold key</h2>
          </div>
          <span className="badge badge-gold">FHE Active</span>
        </div>

        <div className="action-grid">
          <button className="primary-button primary-violet" disabled={working} onClick={() => void onMatchOrders()} type="button">
            Match Orders
          </button>
          <button
            className="secondary-button"
            disabled={working}
            onClick={async () => {
              setDecryptingWinner(true)
              await onRevealWinner()
            }}
            type="button"
          >
            {decryptingWinner ? (
              <span className="button-inline">
                <Lock className="spin" size={16} />
                Decrypting...
              </span>
            ) : (
              'Decrypt Winner'
            )}
          </button>
        </div>

        <article className={`tx-status ${transaction.stage}`}>
          <strong>Transaction status</strong>
          <p>{transaction.summary}</p>
          {transaction.hash ? (
            <a href={`https://sepolia.arbiscan.io/tx/${transaction.hash}`} rel="noreferrer" target="_blank">
              View on Arbiscan
            </a>
          ) : null}
        </article>

        <div className={`winner-cinematic ${snapshot.winnerRevealed ? 'revealed' : ''}`}>
          <p className="eyebrow">
            {snapshot.winnerRevealed ? 'Winner Revealed' : 'Decrypting with threshold key...'}
          </p>
          <div className="winner-reveal-line">
            {visibleWinner || 'Awaiting decrypted winner...'}
          </div>
          {!snapshot.winnerRevealed && snapshot.winnerDecryptRequested ? (
            <p className="micro-copy">Threshold key request sent. Call decrypt again when the winner is ready.</p>
          ) : null}
        </div>
      </section>
    </>
  )
}
