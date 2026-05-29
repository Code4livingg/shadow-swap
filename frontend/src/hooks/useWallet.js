import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider } from 'ethers'
import { ARBITRUM_SEPOLIA } from '../contracts/addresses.js'

/**
 * Connects any injected wallet via window.ethereum (no isMetaMask check),
 * requests accounts, and switches to / adds Arbitrum Sepolia.
 */
export function useWallet() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const isConnected = Boolean(address)
  const isCorrectChain = chainId === ARBITRUM_SEPOLIA.chainId

  // Sync wallet state from an already-injected provider on mount
  useEffect(() => {
    if (!window.ethereum) return

    const browserProvider = new BrowserProvider(window.ethereum)

    const syncState = async () => {
      try {
        const network = await browserProvider.getNetwork()
        setChainId(Number(network.chainId))

        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setProvider(browserProvider)
          const s = await browserProvider.getSigner()
          setSigner(s)
        }
      } catch {
        // wallet not yet connected — silent
      }
    }

    void syncState()

    const handleAccountsChanged = (accounts) => {
      setAddress(accounts[0] ?? '')
      if (!accounts[0]) {
        setSigner(null)
        setProvider(null)
      }
    }

    const handleChainChanged = (hexChainId) => {
      setChainId(Number(hexChainId))
    }

    window.ethereum.on?.('accountsChanged', handleAccountsChanged)
    window.ethereum.on?.('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  const switchToArbitrumSepolia = useCallback(async () => {
    if (!window.ethereum) throw new Error('No injected wallet found.')

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA.chainIdHex }],
      })
    } catch (switchError) {
      // 4902 = chain not added yet
      if (switchError?.code === 4902 || switchError?.code === -32603) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARBITRUM_SEPOLIA.chainIdHex,
              chainName: ARBITRUM_SEPOLIA.chainName,
              nativeCurrency: ARBITRUM_SEPOLIA.nativeCurrency,
              rpcUrls: ARBITRUM_SEPOLIA.rpcUrls,
              blockExplorerUrls: ARBITRUM_SEPOLIA.blockExplorerUrls,
            },
          ],
        })
      } else {
        throw switchError
      }
    }

    setChainId(ARBITRUM_SEPOLIA.chainId)
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No injected wallet detected. Install MetaMask or a compatible wallet.')
      return
    }

    setConnecting(true)
    setError('')

    try {
      // Request accounts — works with any injected provider
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

      const browserProvider = new BrowserProvider(window.ethereum)
      const network = await browserProvider.getNetwork()
      const currentChainId = Number(network.chainId)

      setProvider(browserProvider)
      setChainId(currentChainId)
      setAddress(accounts[0] ?? '')

      // Switch to Arbitrum Sepolia if needed
      if (currentChainId !== ARBITRUM_SEPOLIA.chainId) {
        await switchToArbitrumSepolia()
      }

      const s = await browserProvider.getSigner()
      setSigner(s)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet connection failed.'
      setError(message)
    } finally {
      setConnecting(false)
    }
  }, [switchToArbitrumSepolia])

  const disconnect = useCallback(() => {
    setAddress('')
    setSigner(null)
    setProvider(null)
    setError('')
  }, [])

  return {
    address,
    chainId,
    connect,
    connecting,
    disconnect,
    error,
    isConnected,
    isCorrectChain,
    provider,
    signer,
    switchToArbitrumSepolia,
  }
}
