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
  const walletConnectConfigured = Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID)

  const preferredConnectors = connectors
    .filter((connector) => connector.name !== 'Injected')
    .concat(connectors.filter((connector) => connector.name === 'Injected'))

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
            {preferredConnectors.map((connector) => {
              const isWalletConnect = connector.name === 'WalletConnect'
              const disabled = isPending || (isWalletConnect && !walletConnectConfigured)
              const label = isPending
                ? `Connecting ${connector.name}...`
                : connector.name === 'Injected'
                  ? 'MetaMask'
                  : isWalletConnect && !walletConnectConfigured
                    ? 'WalletConnect Setup'
                    : connector.name

              return (
                <button
                  className="primary-button compact"
                  disabled={disabled}
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  type="button"
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error ? <p className="inline-error">{error.message}</p> : null}
      {!walletConnectConfigured ? (
        <p className="inline-error">
          Set <code>VITE_WALLETCONNECT_PROJECT_ID</code> to enable WalletConnect QR sessions.
        </p>
      ) : null}
    </header>
  )
}
