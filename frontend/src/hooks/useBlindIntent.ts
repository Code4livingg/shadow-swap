import { useCallback, useState } from 'react'
import { arbitrumSepolia } from 'wagmi/chains'
import { encryptIntent, type BlindIntent } from '../utils/encryptIntent'
import { submitBlindIntentPayload } from '../contracts/ShadowSwap'

const ARBITRUM_SEPOLIA_HEX = `0x${arbitrumSepolia.id.toString(16)}`

async function ensureArbitrumSepolia() {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask to submit a blind intent.')
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

export function useBlindIntent() {
  const [submittingBlindIntent, setSubmittingBlindIntent] = useState(false)

  const submitBlindIntent = useCallback(async (intent: BlindIntent) => {
    setSubmittingBlindIntent(true)

    try {
      await ensureArbitrumSepolia()

      const encryptedIntent = encryptIntent(intent)
      console.log('Encrypted payload', encryptedIntent)

      const txHash = await submitBlindIntentPayload(encryptedIntent)
      console.log('Blind intent submitted')
      console.log('Blind intent tx hash', txHash)

      return txHash
    } finally {
      setSubmittingBlindIntent(false)
    }
  }, [])

  return {
    submitBlindIntent,
    submittingBlindIntent,
  }
}
