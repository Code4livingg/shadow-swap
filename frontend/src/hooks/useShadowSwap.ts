import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserProvider } from 'ethers'
import { useAccount, useChainId } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { encryptOrderInputs, initializeCofhe } from '../lib/cofhe'
import {
  getOrders,
  getShadowSwapAddress,
  isDeploymentPending,
  matchOrders,
  readShadowSwapSnapshot,
  revealWinner,
  submitEncryptedOrder,
  type OrderbookRow,
  type ShadowSwapSnapshot,
} from '../contracts/ShadowSwap'

export type OrderFormValues = {
  amount: string
  isBuy: boolean
  price: string
  tokenA: string
  tokenB: string
}

type ToastMessage = {
  description: string
  id: string
  tone: 'error' | 'info' | 'success'
  title: string
}

export type TransactionEntry = {
  action: 'match' | 'reveal' | 'submit'
  amount?: string
  hash: string
  id: string
  pair?: string
  status: 'confirmed' | 'failed'
  submittedAt: string
}

export type TransactionState = {
  hash: string | null
  stage: 'awaiting-signature' | 'confirmed' | 'error' | 'idle' | 'pending'
  summary: string
}

const HISTORY_STORAGE_KEY = 'shadow-swap:tx-history'

const ARBITRUM_SEPOLIA_HEX = `0x${arbitrumSepolia.id.toString(16)}`

const defaultSnapshot: ShadowSwapSnapshot = {
  deploymentPending: true,
  hasBuyOrdersHandle: '0',
  hasSellOrdersHandle: '0',
  highestBuyAmountHandle: '0',
  highestBuyPriceHandle: '0',
  highestSellAmountHandle: '0',
  highestSellPriceHandle: '0',
  orderCount: 0,
  revealedWinnerAmount: '0',
  revealedWinnerIsBuy: false,
  revealedWinnerPrice: '0',
  revealedWinnerTrader: '0x0000000000000000000000000000000000000000',
  winnerAmountHandle: '0',
  winnerDecryptRequested: false,
  winnerIsBuyHandle: '0',
  winnerPriceHandle: '0',
  winnerRevealed: false,
}

const readHistory = () => {
  if (typeof window === 'undefined') {
    return [] as TransactionEntry[]
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) return [] as TransactionEntry[]

  try {
    const parsed = JSON.parse(raw) as TransactionEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const persistHistory = (history: TransactionEntry[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 8)))
}

const createToast = (tone: ToastMessage['tone'], title: string, description: string): ToastMessage => ({
  description,
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  tone,
})

const isValidPositiveInteger = (value: string) => /^[0-9]+$/.test(value) && Number(value) > 0

async function ensureArbitrumSepolia() {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask or a WalletConnect-compatible wallet.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_SEPOLIA_HEX }],
    })
  } catch {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          blockExplorerUrls: ['https://sepolia.arbiscan.io'],
          chainId: ARBITRUM_SEPOLIA_HEX,
          chainName: 'Arbitrum Sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
          },
          rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        },
      ],
    })
  }
}

export function useShadowSwap() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [snapshot, setSnapshot] = useState<ShadowSwapSnapshot>(defaultSnapshot)
  const [orderbook, setOrderbook] = useState<OrderbookRow[]>([])
  const [history, setHistory] = useState<TransactionEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [matching, setMatching] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [transaction, setTransaction] = useState<TransactionState>({
    hash: null,
    stage: 'idle',
    summary: 'ShadowSwap is ready.',
  })
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const pushToast = useCallback((toast: ToastMessage) => {
    setToasts((current) => [...current, toast])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id))
    }, 4200)
  }, [])

  const appendHistory = useCallback((entry: TransactionEntry) => {
    setHistory((current) => {
      const next = [entry, ...current].slice(0, 8)
      persistHistory(next)
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)

    try {
      const [nextSnapshot, nextOrderbook] = await Promise.all([
        readShadowSwapSnapshot(),
        getOrders(),
      ])

      setSnapshot(nextSnapshot)
      setOrderbook(nextOrderbook)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load ShadowSwap state.'
      setTransaction({
        hash: null,
        stage: 'error',
        summary: message,
      })
      pushToast(createToast('error', 'Refresh failed', message))
    } finally {
      setRefreshing(false)
    }
  }, [pushToast])

  useEffect(() => {
    setHistory(readHistory())
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (isConnected) {
      void refresh()
    }
  }, [isConnected, refresh])

  const networkMismatch = isConnected && chainId !== arbitrumSepolia.id
  const deploymentPendingState = isDeploymentPending()

  const headerNetworkLabel = useMemo(() => {
    if (!isConnected) return 'Wallet disconnected'
    if (networkMismatch) return 'Wrong network'
    return arbitrumSepolia.name
  }, [isConnected, networkMismatch])

  const userTradeCount = history.filter((entry) => entry.action === 'submit').length
  const fheOperationsToday = history.length + snapshot.orderCount + orderbook.length

  const recentEncryptedActivity = useMemo(() => {
    const demoEntries = [
      '0x7f3a...sealed an order · 2min ago · 🔐',
      '0x2b1c...joined Club #3 · 5min ago · 🕶',
      'Match executed · Winner revealed · 12min ago · ✓',
    ]

    const historyEntries = history.slice(0, 3).map((entry) => {
      if (entry.action === 'submit') {
        return `${entry.hash.slice(0, 8)}...sealed an order · just now · 🔐`
      }

      if (entry.action === 'match') {
        return `Ciphertext match executed · just now · ✓`
      }

      return `Threshold key decrypt advanced · just now · 🔐`
    })

    return [...historyEntries, ...demoEntries].slice(0, 6)
  }, [history])

  const submitOrder = useCallback(
    async ({ amount, isBuy, price, tokenA, tokenB }: OrderFormValues) => {
      if (!isConnected) {
        throw new Error('Connect a wallet before submitting an encrypted order.')
      }

      if (!isValidPositiveInteger(price) || !isValidPositiveInteger(amount)) {
        throw new Error('Price and amount must be positive integers for the current CoFHE uint32 flow.')
      }

      setSubmitting(true)
      setTransaction({
        hash: null,
        stage: 'awaiting-signature',
        summary: 'Requesting wallet signature for encrypted order submission...',
      })

      try {
        await ensureArbitrumSepolia()

        const walletProvider = window.ethereum
        if (!walletProvider) {
          throw new Error('Wallet provider became unavailable during submission.')
        }

        const provider = new BrowserProvider(walletProvider)
        const signer = await provider.getSigner()
        await initializeCofhe(provider, signer)

        const encryptedOrder = await encryptOrderInputs(Number(price), Number(amount))
        setTransaction({
          hash: null,
          stage: 'pending',
          summary: 'Submitting encrypted payload to ShadowSwap...',
        })

        const hash = await submitEncryptedOrder({
          encryptedAmount: encryptedOrder.amount,
          encryptedPrice: encryptedOrder.price,
          isBuy,
        })

        setTransaction({
          hash,
          stage: 'confirmed',
          summary: 'Encrypted order confirmed on Arbitrum Sepolia.',
        })

        appendHistory({
          action: 'submit',
          amount,
          hash,
          id: hash,
          pair: `${tokenA}/${tokenB}`,
          status: 'confirmed',
          submittedAt: new Date().toISOString(),
        })

        pushToast(createToast('success', 'Order sealed', `Encrypted ${isBuy ? 'buy' : 'sell'} order sealed for ${tokenA}/${tokenB}.`))

        await refresh()
        return hash
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Order submission failed.'
        setTransaction({
          hash: null,
          stage: 'error',
          summary: message,
        })
        pushToast(createToast('error', 'Submission failed', message))
        throw error
      } finally {
        setSubmitting(false)
      }
    },
    [appendHistory, isConnected, pushToast, refresh],
  )

  const runMatchOrders = useCallback(async () => {
    setMatching(true)
    setTransaction({
      hash: null,
      stage: 'awaiting-signature',
      summary: 'Requesting signature to match encrypted orders...',
    })

    try {
      await ensureArbitrumSepolia()
      setTransaction({
        hash: null,
        stage: 'pending',
        summary: 'Matching encrypted orders on-chain...',
      })

      const hash = await matchOrders()
      setTransaction({
        hash,
        stage: 'confirmed',
        summary: 'Order matching confirmed.',
      })

      appendHistory({
        action: 'match',
        hash,
        id: hash,
        status: 'confirmed',
        submittedAt: new Date().toISOString(),
      })

      pushToast(createToast('success', 'Orders matched', 'Encrypted auction state was updated.'))
      await refresh()
      return hash
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Order matching failed.'
      setTransaction({
        hash: null,
        stage: 'error',
        summary: message,
      })
      pushToast(createToast('error', 'Matching failed', message))
    } finally {
      setMatching(false)
    }
  }, [appendHistory, pushToast, refresh])

  const runRevealWinner = useCallback(async () => {
    setRevealing(true)
    setTransaction({
      hash: null,
      stage: 'awaiting-signature',
      summary: 'Requesting signature to reveal the matched winner...',
    })

    try {
      await ensureArbitrumSepolia()
      setTransaction({
        hash: null,
        stage: 'pending',
        summary: 'Submitting winner reveal request...',
      })

      const hash = await revealWinner()
      setTransaction({
        hash,
        stage: 'confirmed',
        summary: 'Winner reveal transaction confirmed.',
      })

      appendHistory({
        action: 'reveal',
        hash,
        id: hash,
        status: 'confirmed',
        submittedAt: new Date().toISOString(),
      })

      pushToast(createToast('success', 'Decrypt request sent', 'Winner decryption flow moved forward.'))
      await refresh()
      return hash
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reveal failed.'
      setTransaction({
        hash: null,
        stage: 'error',
        summary: message,
      })
      pushToast(createToast('error', 'Reveal failed', message))
    } finally {
      setRevealing(false)
    }
  }, [appendHistory, pushToast, refresh])

  return {
    address,
    contractAddress: getShadowSwapAddress(),
    deploymentPending: deploymentPendingState,
    headerNetworkLabel,
    history,
    recentEncryptedActivity,
    isConnected,
    matching,
    networkMismatch,
    orderbook,
    refresh,
    refreshing,
    revealing,
    runMatchOrders,
    runRevealWinner,
    snapshot,
    submitOrder,
    submitting,
    userTradeCount,
    fheOperationsToday,
    toasts,
    transaction,
  }
}
