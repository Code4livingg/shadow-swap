import { useConnect, useDisconnect } from 'wagmi'
import { FHEStatusBar } from './FHEStatusBar'

type HeaderProps = {
  address?: string
  isConnected: boolean
  networkLabel: string
  networkMismatch: boolean
  orderCount: number
}

const truncateAddress = (address?: string) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'

export function Header({
  address,
  isConnected,
  networkLabel,
  networkMismatch,
  orderCount,
}: HeaderProps) {
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const metaMaskConnector =
    connectors.find((connector) => connector.name === 'MetaMask') ??
    connectors.find((connector) => connector.name === 'Injected')

  const connectLabel = isPending ? 'Connecting MetaMask...' : 'Connect MetaMask'

  return (
    <header className="topbar glass-panel">
      <div className="topbar-brand">
        <div className="brand-mark">S</div>
        <div>
          <h1>ShadowSwap</h1>
          <p className="subtitle">PRIVATE TRADING CLUB</p>
        </div>
      </div>

      <FHEStatusBar orderCount={orderCount} />

      <div className="topbar-actions">
        <div className={`network-chip ${networkMismatch ? 'danger' : 'success'}`}>{networkLabel}</div>
        <div className="wallet-chip mono">{truncateAddress(address)}</div>

        {isConnected ? (
          <button className="secondary-button" onClick={() => disconnect()} type="button">
            Disconnect
          </button>
        ) : (
          <div className="wallet-button-row">
            <button
              className="primary-button compact"
              disabled={!metaMaskConnector || isPending}
              onClick={() => {
                if (metaMaskConnector) {
                  connect({ connector: metaMaskConnector })
                }
              }}
              type="button"
            >
              {connectLabel}
            </button>
          </div>
        )}
      </div>

      {error ? <p className="inline-error">{error.message}</p> : null}
    </header>
  )
}
