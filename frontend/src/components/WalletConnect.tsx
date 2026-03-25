import { useConnect, useDisconnect, useAccount, useChainId } from 'wagmi'

const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()

  const injectedConnector = connectors[0]

  return (
    <section className="panel hero-panel">
      <div>
        <p className="eyebrow">Private Orderbook DEX</p>
        <h1>ShadowSwap</h1>
        <p className="lede">
          Confidential order submission and winner discovery powered by Fhenix CoFHE.
        </p>
      </div>

      <div className="wallet-box">
        {isConnected && address ? (
          <>
            <div className="wallet-meta">
              <span className="badge live">Connected</span>
              <span>{truncateAddress(address)}</span>
              <span>Chain {chainId}</span>
            </div>
            <button className="secondary-button" onClick={() => disconnect()}>
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div className="wallet-meta">
              <span className="badge">Wallet</span>
              <span>Connect an injected wallet to encrypt and submit orders.</span>
            </div>
            <button
              className="primary-button"
              disabled={!injectedConnector || isPending}
              onClick={() => {
                if (injectedConnector) {
                  connect({ connector: injectedConnector })
                }
              }}
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </>
        )}
        {error ? <p className="error-text">{error.message}</p> : null}
      </div>
    </section>
  )
}
