import { useEffect, useState } from 'react'
import { BrowserProvider, Contract, ethers } from 'ethers'
import { cofhejs, FheTypes } from '@fhenixprotocol/cofhejs'
import addresses from '../../../deployments/addresses.json'
import { ShadowIntentABI, ShadowSettlementABI } from '../abis'

type TradeDirection = 'BUY' | 'SELL'
type TradePair = 'ETH/USDC' | 'WBTC/ETH' | 'ARB/USDC' | 'LINK/ETH'
type IntentStatus = 'Pending' | 'Matched' | 'Settled'
type UiPhase = 'idle' | 'encrypting' | 'submitting' | 'success' | 'error'

type StoredIntent = {
  id: number
  pair: TradePair
  timestamp: number
}

type IntentListItem = StoredIntent & {
  status: IntentStatus
}

type ShadowIntentAddresses = {
  chainId?: number
  shadowIntent?: string
  shadowMatcher?: string
  shadowSettlement?: string
}

type EthereumWithEvents = {
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
}

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614n
const ARBITRUM_SEPOLIA_HEX = '0x66eee'
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
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as StoredIntent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeStoredIntents = (intents: StoredIntent[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(intents))
}

const isValidAddress = (value: string | undefined): value is string => Boolean(value && ethers.isAddress(value))

const deploymentConfig = addresses as ShadowIntentAddresses

export function ShadowSwapApp() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [chainId, setChainId] = useState<bigint | null>(null)
  const [intentCount, setIntentCount] = useState<number | null>(null)
  const [phase, setPhase] = useState<UiPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successState, setSuccessState] = useState<{ intentId: string; txHash: string } | null>(null)
  const [pendingTxHash, setPendingTxHash] = useState<string>('')
  const [intentItems, setIntentItems] = useState<IntentListItem[]>([])
  const [pair, setPair] = useState<TradePair>('ETH/USDC')
  const [amount, setAmount] = useState('1.5')
  const [direction, setDirection] = useState<TradeDirection>('BUY')
  const [priceLimit, setPriceLimit] = useState('3500')

  const configuredIntentAddress = deploymentConfig.shadowIntent ?? ''
  const configuredSettlementAddress = deploymentConfig.shadowSettlement ?? ''
  const hasValidDeployment = isValidAddress(configuredIntentAddress) && isValidAddress(configuredSettlementAddress)
  const wrongNetwork = chainId !== null && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID

  useEffect(() => {
    const ethereum = window.ethereum as EthereumWithEvents | undefined
    if (!ethereum) {
      return
    }

    const browserProvider = new BrowserProvider(ethereum)
    setProvider(browserProvider)

    const syncWalletState = async () => {
      const network = await browserProvider.getNetwork()
      setChainId(network.chainId)

      const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[]
      setWalletAddress(accounts[0] ?? '')
    }

    void syncWalletState()

    const handleAccountsChanged = (...args: unknown[]) => {
      const [accounts] = args as [string[]]
      setWalletAddress(accounts[0] ?? '')
      setSuccessState(null)
      setPendingTxHash('')
      setPhase('idle')
    }

    const handleChainChanged = (...args: unknown[]) => {
      const [hexChainId] = args as [string]
      setChainId(BigInt(hexChainId))
    }

    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('chainChanged', handleChainChanged)

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  useEffect(() => {
    const loadIntentCount = async () => {
      if (!provider || !hasValidDeployment) {
        setIntentCount(null)
        return
      }

      try {
        const contract = new Contract(configuredIntentAddress, ShadowIntentABI, provider)
        const count = await contract.getIntentCount()
        setIntentCount(Number(count))
      } catch {
        setIntentCount(null)
      }
    }

    void loadIntentCount()
  }, [configuredIntentAddress, hasValidDeployment, provider, successState])

  useEffect(() => {
    const refreshIntentStatuses = async () => {
      if (!provider || !hasValidDeployment) {
        setIntentItems(readStoredIntents().map((entry) => ({ ...entry, status: 'Pending' })))
        return
      }

      try {
        const stored = readStoredIntents()
        const intentContract = new Contract(configuredIntentAddress, ShadowIntentABI, provider)
        const settlementContract = new Contract(configuredSettlementAddress, ShadowSettlementABI, provider)

        const items = await Promise.all(
          stored.map(async (entry) => {
            const matched = await intentContract.isMatched(entry.id)
            const [, settled] = await settlementContract.getExecutionPrice(entry.id)

            let status: IntentStatus = 'Pending'
            if (settled) {
              status = 'Settled'
            } else if (matched) {
              status = 'Matched'
            }

            return {
              ...entry,
              status,
            }
          }),
        )

        setIntentItems(items.sort((left, right) => right.timestamp - left.timestamp))
      } catch {
        setIntentItems(readStoredIntents().map((entry) => ({ ...entry, status: 'Pending' })))
      }
    }

    void refreshIntentStatuses()
  }, [configuredIntentAddress, configuredSettlementAddress, hasValidDeployment, provider, successState])

  const connectWallet = async () => {
    const ethereum = window.ethereum as EthereumWithEvents | undefined
    if (!ethereum) {
      setPhase('error')
      setErrorMessage('MetaMask was not detected. Install MetaMask to use ShadowSwap.')
      return
    }

    try {
      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[]
      const browserProvider = new BrowserProvider(ethereum)
      const network = await browserProvider.getNetwork()

      setProvider(browserProvider)
      setWalletAddress(accounts[0] ?? '')
      setChainId(network.chainId)
      setPhase('idle')
      setErrorMessage('')
      setPendingTxHash('')
    } catch (error) {
      setPhase('error')
      setErrorMessage(parseError(error))
    }
  }

  const switchToArbitrumSepolia = async () => {
    const ethereum = window.ethereum as EthereumWithEvents | undefined
    if (!ethereum) {
      return
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA_HEX }],
      })
      setChainId(ARBITRUM_SEPOLIA_CHAIN_ID)
      setPhase('idle')
      setErrorMessage('')
      setPendingTxHash('')
    } catch {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARBITRUM_SEPOLIA_HEX,
              chainName: 'Arbitrum Sepolia',
              nativeCurrency: {
                decimals: 18,
                name: 'ETH',
                symbol: 'ETH',
              },
              rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://sepolia.arbiscan.io'],
            },
          ],
        })
        setChainId(ARBITRUM_SEPOLIA_CHAIN_ID)
      } catch (error) {
        setPhase('error')
        setErrorMessage(parseError(error))
      }
    }
  }

  const submitIntent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!provider || !walletAddress) {
      setPhase('error')
      setErrorMessage('Connect your wallet before submitting an intent.')
      return
    }

    if (wrongNetwork) {
      setPhase('error')
      setErrorMessage('Wrong network. Switch MetaMask to Arbitrum Sepolia.')
      return
    }

    if (!hasValidDeployment) {
      setPhase('error')
      setErrorMessage('Deployment configuration missing. Populate deployments/addresses.json with Arbitrum Sepolia contract addresses.')
      return
    }

    try {
      const numericAmount = Number(amount)
      const numericPriceLimit = Number(priceLimit)

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Enter a valid amount.')
      }

      if (!Number.isFinite(numericPriceLimit) || numericPriceLimit <= 0) {
        throw new Error('Enter a valid price limit.')
      }

      setPhase('encrypting')
      setErrorMessage('')
      setSuccessState(null)
      setPendingTxHash('')

      await cofhejs.initialize({
        provider,
        environment: 'TESTNET',
      })

      const encAmount = await cofhejs.encrypt(Math.floor(numericAmount * 1000), FheTypes.Uint32)
      const encDirection = await cofhejs.encrypt(direction === 'BUY' ? 1 : 0, FheTypes.Uint8)
      const encPriceLimit = await cofhejs.encrypt(Math.floor(numericPriceLimit * 100), FheTypes.Uint32)

      setPhase('submitting')

      const signer = await provider.getSigner()
      const shadowIntentContract = new Contract(configuredIntentAddress, ShadowIntentABI, signer)
      const transaction = await shadowIntentContract.submitIntent(encAmount, encDirection, encPriceLimit)
      setPendingTxHash(transaction.hash)
      const receipt = await transaction.wait()

      const intentSubmittedEvent = receipt?.logs
        .map((log: { topics: ReadonlyArray<string>; data: string }) => {
          try {
            return shadowIntentContract.interface.parseLog(log)
          } catch {
            return null
          }
        })
        .find((parsed: { name: string; args: { trader?: string; intentId?: bigint } } | null) => {
          if (!parsed || parsed.name !== 'IntentSubmitted') {
            return false
          }

          return parsed.args.trader?.toLowerCase() === walletAddress.toLowerCase()
        })

      const intentId = intentSubmittedEvent?.args.intentId?.toString() ?? 'unknown'

      if (intentId !== 'unknown') {
        const stored = readStoredIntents()
        const nextStored = [
          {
            id: Number(intentId),
            pair,
            timestamp: Date.now(),
          },
          ...stored.filter((entry) => entry.id !== Number(intentId)),
        ].slice(0, 20)

        writeStoredIntents(nextStored)
      }

      setSuccessState({
        intentId,
        txHash: transaction.hash,
      })
      setPendingTxHash('')
      setPhase('success')
      setAmount('1.5')
      setPriceLimit('3500')
    } catch (error) {
      setPendingTxHash('')
      setPhase('error')
      setErrorMessage(parseError(error))
    }
  }

  return (
    <section className="rounded-[30px] border border-white/8 bg-[#0a0a0f] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.5)] md:px-8">
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

          {!walletAddress ? (
            <div className="flex flex-col gap-3 xl:items-end">
              <button
                className="rounded-2xl bg-[#00d4aa] px-5 py-3 text-sm font-semibold tracking-[0.16em] text-[#031612] transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => void connectWallet()}
                type="button"
              >
                Connect Wallet
              </button>
              {!window.ethereum ? (
                <a
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/52 transition-colors hover:text-white"
                  href="https://metamask.io/download/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Install MetaMask
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/82">
              {formatAddress(walletAddress)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
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

          <form className="grid gap-5" onSubmit={(event) => void submitIntent(event)}>
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
              disabled={phase === 'encrypting' || phase === 'submitting' || !walletAddress || wrongNetwork}
              type="submit"
            >
              Submit Encrypted Intent
            </button>
          </form>
        </div>

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

            {phase === 'idle' ? (
              <p className="text-white/60">Ready to encrypt and submit a new blind intent.</p>
            ) : null}

            {phase === 'encrypting' ? (
              <div className="flex items-center gap-3 text-white/72">
                <span className="h-3 w-3 animate-pulse rounded-full bg-teal-300" />
                <span>Encrypting intent with FHE...</span>
              </div>
            ) : null}

            {phase === 'submitting' ? (
              <div className="grid gap-3 text-white/72">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
                  <span>Broadcasting to Arbitrum Sepolia...</span>
                </div>
                {pendingTxHash ? (
                  <a
                    className="break-all font-mono text-sm text-teal-200 transition-colors hover:text-white"
                    href={`https://sepolia.arbiscan.io/tx/${pendingTxHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {pendingTxHash}
                  </a>
                ) : null}
              </div>
            ) : null}

            {phase === 'success' && successState ? (
              <div className="grid gap-4">
                <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                  Intent Encrypted &amp; Submitted
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Transaction</p>
                  <a
                    className="mt-2 block break-all font-mono text-sm text-teal-200 transition-colors hover:text-white"
                    href={`https://sepolia.arbiscan.io/tx/${successState.txHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {successState.txHash}
                  </a>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Intent ID</p>
                    <strong className="mt-2 block font-mono text-lg text-white">{successState.intentId}</strong>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#0d1118] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Network State</p>
                    <strong className="mt-2 block text-lg text-white">Intent is live on network</strong>
                  </div>
                </div>
              </div>
            ) : null}

            {phase === 'error' ? (
              <div className="rounded-2xl border border-red-400/18 bg-red-400/10 px-4 py-4 text-red-100">
                {errorMessage}
              </div>
            ) : null}

            {!hasValidDeployment ? (
              <div className="mt-4 rounded-2xl border border-orange-300/18 bg-orange-300/10 px-4 py-4 text-sm text-orange-100/90">
                `deployments/addresses.json` does not contain valid Arbitrum Sepolia addresses yet. The terminal is wired to the real contracts API and will become live as soon as those addresses are populated.
              </div>
            ) : null}
          </div>

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
