import type { DecryptedWinnerPreview, ShadowSwapStatus } from '../lib/shadowswap'

type OrderStatusProps = {
  busy: boolean
  clientPreview: DecryptedWinnerPreview | null
  clientPreviewError: string | null
  onRefresh: () => Promise<void>
  status: ShadowSwapStatus | null
  statusMessage: string
}

const renderHandle = (label: string, value: string) => (
  <div className="stat-row" key={label}>
    <span>{label}</span>
    <code>{value}</code>
  </div>
)

export function OrderStatus({
  busy,
  clientPreview,
  clientPreviewError,
  onRefresh,
  status,
  statusMessage,
}: OrderStatusProps) {
  return (
    <section className="panel status-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Order Status</p>
          <h2>Encrypted market snapshot</h2>
        </div>
        <button className="secondary-button" disabled={busy} onClick={() => void onRefresh()}>
          Refresh
        </button>
      </div>

      <p className="status-message">{statusMessage}</p>

      {status ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Order Count</span>
              <strong>{status.orderCount}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Decrypt Requested</span>
              <strong>{status.winnerDecryptRequested ? 'Yes' : 'No'}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Winner Revealed</span>
              <strong>{status.winnerRevealed ? 'Yes' : 'No'}</strong>
            </div>
          </div>

          <div className="handle-list">
            {renderHandle('hasBuyOrders', status.hasBuyOrdersHandle)}
            {renderHandle('hasSellOrders', status.hasSellOrdersHandle)}
            {renderHandle('highestBuyPrice', status.highestBuyPriceHandle)}
            {renderHandle('highestBuyAmount', status.highestBuyAmountHandle)}
            {renderHandle('highestSellPrice', status.highestSellPriceHandle)}
            {renderHandle('highestSellAmount', status.highestSellAmountHandle)}
            {renderHandle('winnerPrice', status.winnerPriceHandle)}
            {renderHandle('winnerAmount', status.winnerAmountHandle)}
            {renderHandle('winnerIsBuy', status.winnerIsBuyHandle)}
          </div>

          {clientPreview ? (
            <div className="winner-card">
              <p className="eyebrow">Client Decrypt Preview</p>
              <p>
                {clientPreview.isBuy ? 'Buy' : 'Sell'} winner at price {clientPreview.price} for{' '}
                {clientPreview.amount}.
              </p>
            </div>
          ) : null}

          {clientPreviewError ? <p className="error-text">{clientPreviewError}</p> : null}

          {status.winnerRevealed ? (
            <div className="winner-card">
              <p className="eyebrow">Revealed Winner</p>
              <p>Trader: {status.revealedWinnerTrader}</p>
              <p>Side: {status.revealedWinnerIsBuy ? 'Buy' : 'Sell'}</p>
              <p>Price: {status.revealedWinnerPrice}</p>
              <p>Amount: {status.revealedWinnerAmount}</p>
            </div>
          ) : null}
        </>
      ) : (
        <p className="muted-text">Load the contract status to inspect encrypted orderbook handles.</p>
      )}
    </section>
  )
}
