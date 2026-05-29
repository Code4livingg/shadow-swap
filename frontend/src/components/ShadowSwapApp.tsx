import { useEffect, useState } from 'react'
import { Contract, ethers } from 'ethers'
import { ShadowIntentABI, ShadowSettlementABI } from '../abis'
import { CONTRACT_ADDRESSES, ARBITRUM_SEPOLIA } from '../contracts/addresses.js'
import { useWallet } from '../hooks/useWallet.js'
import { useShadowSwapIntent } from '../hooks/useShadowSwapIntent.js'

type TradeDirection = 'BUY' | 'SELL'
type TradePair = 'ETH/USDC' | 'WBTC/ETH' | 'ARB/USDC' | 'LINK/ETH'
type IntentStatus = 'Pending' | 'Matched' | 'Settled'

type StoredIntent = {
  id: number
  pair: TradePair
  timestamp: number
}

type IntentListItem = StoredIntent & {
  status: IntentStatus
}

const LOCAL_STORAGE_KEY = 'shadowswap.my-intents'

const formatAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

const parseError = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Something went wrong while processing your intent.'
}

const readStoredIntents = (): StoredIntent[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredIntent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeStoredIntents = (intents: StoredIntent[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(intents))
}

export function ShadowSwapApp() {
  // Wallet state from the new useWallet hook (window.ethereum only, no isMetaMask)
  const {
    address: walletAddress,
    connect: connectWallet,
    connecting,
    disconnect,
    error: walletError,
    isConnected,
    isCorrectChain,
    provider,
    switchToArbitrumSepolia,
  } = useWallet()

  // ShadowIntent contract interactions
  const {
    intentCount,
    txHash,
    intentId: submittedIntentId,
    loading: intentLoading,
    error: intentError,
    submitIntent: submitIntentHook,
    arbiscanUrl,
  } = useShadowSwapIntent()

  const [intentItems, setIntentItems] = useState<IntentListItem[]>([])
  const [pair, setPair] = useState<TradePair>('ETH/USDC')
  const [amount, setAmount] = useState('1.5')
  const [direction, setDirection] = useState<TradeDirection>('BUY')
  const [priceLimit, setPriceLimit] = useState('3500')
  const [localError, setLocalError] = useState('')
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const wrongNetwork = isConnected && !isCorrectChain
  const errorMessage = localError || walletError || intentError

  // Refresh intent statuses whenever a new tx lands
  useEffect(() => {
    const refreshIntentStatuses = async () => {
      if (!provider) {
        setIntentItems(readStoredIntents().map((entry) => ({ ...entry, status: 'Pending' as IntentStatus })))
        return
      }

      try {
        const stored = readStoredIntents()
        if (stored.length === 0) {
          setIntentItems([])
          return
        }

        const intentContract = new Contract(CONTRACT_ADDRESSES.shadowIntent, ShadowIntentABI, provider)
        const settlementContract = new Contract(CONTRACT_ADDRESSES.shadowSettlement, ShadowSettlementABI, provider)

        const items = await Promise.all(
          stored.map(async (entry) => {
            try {
              const matched = await intentContract.isMatched(entry.id)
              let settled = false
              try {
                const [, s] = await settlementContract.getExecutionPrice(entry.id)
                settled = Boolean(s)
              } catch {
                // settlement may not have this intent yet
              }

              let status: IntentStatus = 'Pending'
              if (settled) status = 'Settled'
              else if (matched) status = 'Matched'

              return { ...entry, status }
            } catch {
              return { ...entry, status: 'Pending' as IntentStatus }
            }
          }),
        )

        setIntentItems(items.sort((a, b) => b.timestamp - a.timestamp))
      } catch {
        setIntentItems(readStoredIntents().map((entry) => ({ ...entry, status: 'Pending' as IntentStatus })))
      }
    }

    void refreshIntentStatuses()
  }, [provider, txHash])

  // Persist newly submitted intent to local storage
  useEffect(() => {
    if (submittedIntentId && submittedIntentId !== 'unknown') {
      const stored = readStoredIntents()
      const nextStored = [
        { id: Number(submittedIntentId), pair, timestamp: Date.now() },
        ...stored.filter((e) => e.id !== Number(submittedIntentId)),
      ].slice(0, 20)
      writeStoredIntents(nextStored)
    }
  }, [submittedIntentId, pair])

  // Sync phase with hook state
  useEffect(() => {
    if (intentLoading) {
      setPhase('submitting')
    } else if (txHash && !intentLoading) {
      setPhase('success')
    } else if (intentError) {
      setPhase('error')
    }
  }, [intentLoading, txHash, intentError])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError('')

    if (!isConnected || !walletAddress) {
      setLocalError('Connect your wallet before submitting an intent.')
      setPhase('error')
      return
    }

    if (wrongNetwork) {
      setLocalError('Wrong network. Switch to Arbitrum Sepolia.')
      setPhase('error')
      return
    }

    const numericAmount = Number(amount)
    const numericPriceLimit = Number(priceLimit)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLocalError('Enter a valid amount.')
      setPhase('error')
      return
    }

    if (!Number.isFinite(numericPriceLimit) || numericPriceLimit <= 0) {
      setLocalError('Enter a valid price limit.')
      setPhase('error')
      return
    }

    try {
      // Build keccak256 hash of intent params as the encrypted payload
      const encryptedHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint256', 'uint8', 'uint256'],
          [
            BigInt(Math.floor(numericAmount * 1000)),
            direction === 'BUY' ? 1 : 0,
            BigInt(Math.floor(numericPriceLimit * 100)),
          ],
        ),
      )

      await submitIntentHook(encryptedHash, amount, pair.split('/')[0])

      setAmount('1.5')
      setPriceLimit('3500')
    } catch (err) {
      setLocalError(parseError(err))
      setPhase('error')
    }
  }

  return (
    <section className="rounded-[30px] border border-white/8 bg-[#0a0a0f] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.5)] md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 border-b border-white/8 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-teal-100/58">Launch App</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">ShadowSwap terminal</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/60">
            Submit blind intents to the live network, encrypt trade parameters client-side, and monitor onchain intent state from the same terminal.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="rounded-full border border-teal-400/14 bg-teal-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.26em] text-teal-100/74">
            {intentCount !== null ? `${intentCount} intents on network` : 'Intent count unavailable'}
          </div>

          {!isConnected ? (
            <div className="flex flex-col gap-3 xl:items-end">
              <button
                className="rounded-2xl bg-[#00d4aa] px-5 py-3 text-sm font-semibold tracking-[0.16em] text-[#031612] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                disabled={connecting}
                onClick={() => void connectWallet()}
                type="button"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              {!window.ethereum ? (
                <a
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/52 transition-colors hover:text-white"
                  href="https://metamask.io/download/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Install a wallet
                </a>
              ) : null}
            </div>
          ) : wrongNetwork ? (
            <button
              className="rounded-2xl border border-orange-300/24 bg-orange-300/10 px-5 py-3 text-sm font-semibold tracking-[0.16em] text-orange-100 transition-transform duration-200 hover:-translate-y-0.5"
              onClick={() => void switchToArbitrumSepolia()}
              type="button"
            >
              Switch to Arbitrum Sepolia
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/82">
                {formatAddress(walletAddress)}
              </div>
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white/60 transition-colors hover:text-white"
                onClick={disconnect}
                type="button"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        {/* Intent submission form */}
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Intent Submission</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Encrypted trade terminal</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/54">
              Arbitrum Sepolia
            </div>
          </div>

          <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50">Token Pair</span>
              <select
                className="rounded-2xl border border-white/10 bg-[#0e1117] px-4 py-3 text-white outline-none transition-colors focus:border-teal-400/45"
                onChange={(event) => setPair(event.target.value as TradePair)}
                value={pair}
              >
                <option value="ETH/USDC">ETH/USDC</option>
                <option value="WBTC/ETH">WBTC/ETH</option>
                <option value="ARB/USDC">ARB/USDC</option>
                <option value="LINK/ETH">LINK/ETH</option>
              </select>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50">Amount</span>
                <input
                  className="rounded-2xl border border-white/10 bg-[#0e1117] px-4 py-3 text-white outline-none transition-colors focus:border-teal-400/45"
                  inputMode="decimal"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="1.5"
                  type="number"
                  value={amount}
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50">Price Limit</span>
                <input
                  className="rounded-2xl border border-white/10 bg-[#0e1117] px-4 py-3 text-white outline-none transition-colors focus:border-teal-400/45"
                  inputMode="decimal"
                  onChange={(event) => setPriceLimit(event.target.value)}
                  placeholder="3500"
                  type="number"
                  value={priceLimit}
                />
              </label>
            </div>

            <fieldset className="grid gap-3">
              <legend className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/50">Direction</legend>
              <div className="grid gap-3 md:grid-cols-2">
                {(['BUY', 'SELL'] as const).map((value) => (
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
                      direction === value
                        ? 'border-teal-400/35 bg-teal-400/10 text-white'
                        : 'border-white/10 bg-[#0e1117] text-white/72'
                    }`}
                    key={value}
                  >
                    <span className="font-mono text-sm tracking-[0.16em]">{value}</span>
                    <input
                      checked={direction === value}
                      className="hidden"
                      name="direction"
                      onChange={() => setDirection(value)}
                      type="radio"
                    />
                    <span className={`h-2.5 w-2.5 rounded-full ${direction === value ? 'bg-[#00d4aa]' : 'bg-white/20'}`} />
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              className="mt-2 rounded-2xl bg-[#00d4aa] px-5 py-4 text-sm font-semibold tracking-[0.18em] text-[#031612] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={intentLoading || !isConnected || wrongNetwork}
              type="submit"
            >
              {intentLoading ? 'Submitting...' : 'Submit Encrypted Intent'}
            </button>
          </form>
        </div>

        {/* Status + intent ledger */}
        <div className="grid gap-6">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Execution State</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Intent status</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/54">
                {phase}
              </span>
            </div>

            {phase === 'idle' && (
              <p className="text-white/60">Ready to encrypt and submit a new blind intent.</p>
            )}

            {phase === 'submitting' && (
              <div className="flex items-center gap-3 text-white/72">
                <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
                <span>Broadcasting to Arbitrum Sepolia...</span>
              </div>
            )}

            {phase === 'success' && txHash && (
              <div className="grid gap-4">
                <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                  Intent Encrypted &amp; Submitted
                </div>

                {/* Arbiscan link */}
                <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Transaction</p>
                  <a
                    className="mt-2 block break-all font-mono text-sm text-teal-200 transition-colors hover:text-white"
                    href={arbiscanUrl ?? `https://sepolia.arbiscan.io/tx/${txHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View on Arbiscan ↗
                  </a>
                  <p className="mt-1 break-all font-mono text-xs text-white/40">{txHash}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Intent ID</p>
                    <strong className="mt-2 block font-mono text-lg text-white">
                      {submittedIntentId ?? 'Parsing...'}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Network</p>
                    <strong className="mt-2 block text-lg text-white">
                      {ARBITRUM_SEPOLIA.chainName}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {phase === 'error' && errorMessage && (
              <div className="rounded-2xl border border-red-400/18 bg-red-400/10 px-4 py-4 text-red-100">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Local intent ledger */}
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">My Intents</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Local intent ledger</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/54">
                {intentItems.length} tracked
              </span>
            </div>

            <div className="space-y-3">
              {intentItems.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-5 text-white/55">
                  Submitted intents will appear here with live onchain status checks.
                </div>
              ) : (
                intentItems.map((item) => (
                  <article
                    className="grid gap-3 rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4 md:grid-cols-[0.6fr_1fr_0.8fr_0.7fr]"
                    key={`${item.id}-${item.timestamp}`}
                  >
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">ID</p>
                      <strong className="mt-1 block font-mono text-white">{item.id}</strong>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">Pair</p>
                      <strong className="mt-1 block text-white">{item.pair}</strong>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">Time</p>
                      <strong className="mt-1 block font-mono text-white/80">{formatTime(item.timestamp)}</strong>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">Status</p>
                      <strong
                        className={`mt-1 block ${
                          item.status === 'Settled'
                            ? 'text-cyan-200'
                            : item.status === 'Matched'
                              ? 'text-emerald-200'
                              : 'text-white/78'
                        }`}
                      >
                        {item.status}
                      </strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShadowSwapApp
