import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { arbitrumSepolia } from 'wagmi/chains'
import { encryptIntent, type BlindIntent } from '../utils/encryptIntent'
import {
  ARBITRUM_SEPOLIA_RPC_URL,
  CONTRACT_ADDRESS,
  SHADOW_SWAP_ABI,
} from '../contracts/ShadowSwap'

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

  useEffect(() => {
    if (!CONTRACT_ADDRESS) {
      return
    }

    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC_URL)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, SHADOW_SWAP_ABI, provider)

    const handleIntentSubmitted = (user: string, intentId: bigint) => {
      console.log('IntentSubmitted', {
        intentId: intentId.toString(),
        user,
      })
    }

    const handleMatchCreated = (intentA: bigint, intentB: bigint) => {
      console.log('MatchCreated', {
        intentA: intentA.toString(),
        intentB: intentB.toString(),
      })
    }

    contract.on('BlindIntentSubmitted', handleIntentSubmitted)
    contract.on('IntentMatched', handleMatchCreated)

    return () => {
      contract.off('BlindIntentSubmitted', handleIntentSubmitted)
      contract.off('IntentMatched', handleMatchCreated)
    }
  }, [])

  const submitBlindIntent = useCallback(async (intent: BlindIntent) => {
    setSubmittingBlindIntent(true)

    try {
      await ensureArbitrumSepolia()

      if (!window.ethereum) {
        throw new Error('No wallet provider found.')
      }

      if (!CONTRACT_ADDRESS) {
        throw new Error('VITE_CONTRACT_ADDRESS is not set')
      }

      const encryptedPayload = encryptIntent(intent)
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()

      if (network.chainId !== 421614n) {
        throw new Error('Wrong network. Switch MetaMask to Arbitrum Sepolia (421614).')
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, SHADOW_SWAP_ABI, signer)

      console.log('Wallet connected:', signer.address)
      console.log('Contract:', CONTRACT_ADDRESS)
      console.log('Submitting payload:', encryptedPayload)
      console.log('Submitting intent...')

      const tx = await contract.submitIntent(encryptedPayload)
      await tx.wait()

      console.log('Intent submitted:', tx.hash)

      return tx.hash as string
    } catch (err) {
      console.error('Submit failed:', err)
      throw err
    } finally {
      setSubmittingBlindIntent(false)
    }
  }, [])

  return {
    submitBlindIntent,
    submittingBlindIntent,
  }
}
