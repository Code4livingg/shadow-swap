import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import './App.css'
import { OrderStatus } from './components/OrderStatus'
import { SubmitOrder, type SubmitOrderValues } from './components/SubmitOrder'
import { WalletConnect } from './components/WalletConnect'
import {
  decryptWinnerPreview,
  getShadowSwapStatus,
  matchOrders,
  revealWinner,
  submitOrder,
  type DecryptedWinnerPreview,
  type ShadowSwapStatus,
} from './lib/shadowswap'

function App() {
  const { isConnected } = useAccount()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<ShadowSwapStatus | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to load ShadowSwap.')
  const [clientPreview, setClientPreview] = useState<DecryptedWinnerPreview | null>(null)
  const [clientPreviewError, setClientPreviewError] = useState<string | null>(null)

  const refreshStatus = async () => {
    setBusy(true)
    setStatusMessage('Refreshing encrypted orderbook state...')

    try {
      const nextStatus = await getShadowSwapStatus()
      setStatus(nextStatus)
      setStatusMessage('Encrypted market state loaded.')

      if (isConnected && nextStatus.winnerPriceHandle !== '0') {
        try {
          const preview = await decryptWinnerPreview(nextStatus)
          setClientPreview(preview)
          setClientPreviewError(null)
        } catch (error) {
          setClientPreview(null)
          setClientPreviewError(error instanceof Error ? error.message : 'Preview decryption failed')
        }
      } else {
        setClientPreview(null)
        setClientPreviewError(null)
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to refresh status')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void refreshStatus()
  }, [isConnected])

  const handleSubmitOrder = async ({ price, amount, isBuy }: SubmitOrderValues) => {
    setBusy(true)
    setStatusMessage('Encrypting order and submitting to ShadowSwap...')

    try {
      const hash = await submitOrder(price, amount, isBuy)
      setStatusMessage(`Order submitted: ${hash}`)
      await refreshStatus()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Order submission failed')
    } finally {
      setBusy(false)
    }
  }

  const handleMatchOrders = async () => {
    setBusy(true)
    setStatusMessage('Matching encrypted orders...')

    try {
      const hash = await matchOrders()
      setStatusMessage(`Orders matched: ${hash}`)
      await refreshStatus()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Match failed')
    } finally {
      setBusy(false)
    }
  }

  const handleRevealWinner = async () => {
    setBusy(true)
    setStatusMessage('Triggering winner reveal flow...')

    try {
      const hash = await revealWinner()
      setStatusMessage(`Reveal transaction sent: ${hash}`)
      await refreshStatus()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Reveal failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app-shell">
      <WalletConnect />

      <section className="dashboard-grid">
        <SubmitOrder
          disabled={!isConnected || busy}
          submitting={busy}
          onSubmit={handleSubmitOrder}
        />

        <section className="panel action-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Execution</p>
              <h2>Run matching and reveal</h2>
            </div>
          </div>

          <div className="action-stack">
            <button
              className="primary-button"
              disabled={!isConnected || busy}
              onClick={() => void handleMatchOrders()}
            >
              Match Orders
            </button>
            <button
              className="secondary-button"
              disabled={!isConnected || busy}
              onClick={() => void handleRevealWinner()}
            >
              Reveal Winner
            </button>
          </div>

          <p className="muted-text">
            The first reveal call requests decryption on-chain. Call it again once the winner is
            ready.
          </p>
        </section>
      </section>

      <OrderStatus
        busy={busy}
        clientPreview={clientPreview}
        clientPreviewError={clientPreviewError}
        onRefresh={refreshStatus}
        status={status}
        statusMessage={statusMessage}
      />
    </main>
  )
}

export default App
